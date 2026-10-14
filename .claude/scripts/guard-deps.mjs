#!/usr/bin/env node
// PreToolUse guard for docs/rules/learn-before-library.md.
//
// Blocks (exit 2) any tool call that would bring in a library covering a core
// whiteboard layer: a package-manager command naming one, a package.json edit
// adding one, or source code importing one (including from a CDN URL).
//
// A package is unblocked by an accepted ADR in docs/adr/ containing the line
//   Allow-dependency: <package>
//
//   node .claude/scripts/guard-deps.mjs            read hook JSON on stdin (PreToolUse hook)
//   node .claude/scripts/guard-deps.mjs check <s>  print which guarded packages <s> would pull in

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ADR = path.join(ROOT, 'docs', 'adr');

// `x/*` and `x-*` match by prefix; everything else exactly.
const GUARDED = [
  // whole whiteboards / canvas editors
  'tldraw', '@tldraw/*', 'excalidraw', '@excalidraw/*',
  // scene graphs and canvas renderers
  'konva', 'react-konva', 'fabric', 'pixi.js', '@pixi/*', 'paper', 'two.js', 'zrender', 'roughjs', 'perfect-freehand',
  // sync, CRDTs, hosted multiplayer
  'yjs', 'y-*', '@y-sweet/*', 'automerge', '@automerge/*', 'loro-crdt', '@liveblocks/*', 'liveblocks',
  'partykit', 'partysocket', 'socket.io', 'socket.io-client', '@supabase/realtime-js', 'replicache',
  // spatial indexing (performance layer)
  'rbush', 'flatbush',
];

const isGuarded = (name) => GUARDED.some((g) =>
  g.endsWith('/*') || g.endsWith('-*') ? name.startsWith(g.slice(0, -1)) : name === g);

// "@scope/pkg@1.2" -> "@scope/pkg", "yjs@13" -> "yjs", "yjs/dist/x" -> "yjs"
function pkgName(spec) {
  const s = spec.replace(/^npm:/, '');
  const parts = s.split('/');
  const base = s.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  return base.replace(/(.)@.*$/, '$1');
}

function allowed() {
  const out = new Set();
  let files = [];
  try { files = fs.readdirSync(ADR).filter((f) => f.endsWith('.md')); } catch { return out; }
  for (const f of files) {
    const text = fs.readFileSync(path.join(ADR, f), 'utf8');
    if (!/^-?\s*Status:\s*accepted\b/im.test(text)) continue;
    for (const m of text.matchAll(/^-?\s*Allow-dependency:\s*(\S+)/gim)) out.add(m[1]);
  }
  return out;
}

const PM = /(^|[\s;&|(`])(npm|pnpm|yarn|bun|npx|bunx|deno)(\s|$)/;

function fromCommand(cmd) {
  if (!PM.test(cmd)) return [];
  return cmd.split(/[\s;&|()`'"]+/).filter(Boolean).map(pkgName).filter(isGuarded);
}

function fromPackageJson(text) {
  return [...text.matchAll(/"((?:@[\w.-]+\/)?[\w.-]+)"\s*:\s*"/g)].map((m) => m[1]).filter(isGuarded);
}

function fromSource(text) {
  const specs = [
    ...text.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g),
    ...text.matchAll(/\bimport\s*\(?\s*['"]([^'"]+)['"]/g),
    ...text.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]/g),
  ].map((m) => m[1]);
  const names = specs.filter((s) => !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('http')).map(pkgName);
  // CDN URLs: esm.sh/yjs, cdn.jsdelivr.net/npm/yjs@13, unpkg.com/konva, skypack...
  for (const m of text.matchAll(/https?:\/\/(?:esm\.sh|cdn\.jsdelivr\.net\/npm|unpkg\.com|cdn\.skypack\.dev|ga\.jspm\.io\/npm:)\/?((?:@[\w.-]+\/)?[\w.-]+)/g)) {
    names.push(pkgName(m[1]));
  }
  return names.filter(isGuarded);
}

function inspect(tool, input) {
  if (tool === 'Bash' || tool === 'PowerShell') return fromCommand(input.command || '');
  const file = input.file_path || input.notebook_path || '';
  // Rules and ADRs discuss these packages by name; that's not adopting them.
  if (/[\\/]docs[\\/]/.test(file) || /[\\/]\.claude[\\/]/.test(file)) return [];
  const texts = [input.content, input.new_string, ...(input.edits || []).map((e) => e.new_string)].filter(Boolean);
  const scan = path.basename(file) === 'package.json' ? fromPackageJson : fromSource;
  return texts.flatMap(scan);
}

// The guard locks itself and the rules it enforces. Loosening any of them means
// the user editing the file by hand, outside Claude.
const PROTECTED = [
  '.claude/scripts/guard-deps.mjs',
  '.claude/scripts/rules-match.mjs',
  '.claude/settings.json',
  'docs/rules/learn-before-library.md',
  'docs/rules/user-writes-core-logic.md',
];
const norm = (p) => p.replace(/\\/g, '/');
const protectedHit = (s) => PROTECTED.find((p) => norm(s).includes(p) || norm(s).includes(path.basename(p)));
// Shell commands that can write, move or delete files, or restore them from git.
const WRITES = /(>|\btee\b|\bsed\s+-i|\bperl\s+-[a-z]*i|\brm\b|\bmv\b|\bcp\b|\btruncate\b|\bdd\b|\bchmod\b|\bln\b|\bnode\s+-e|\bpython3?\s+-c|\bgit\s+(checkout|restore|rm|mv|stash|reset|apply|am|cherry-pick|revert)\b|Set-Content|Add-Content|Out-File|Clear-Content|Remove-Item|Move-Item|Copy-Item|Rename-Item|New-Item|\[IO\.File\]|WriteAll)/i;

function tampering(tool, input) {
  const texts = [input.content, input.new_string, ...(input.edits || []).map((e) => e.new_string)].filter(Boolean);
  if (texts.some((t) => /disableAllHooks/.test(t))) return 'disableAllHooks (turns off every guard)';
  if (tool === 'Bash' || tool === 'PowerShell') {
    const cmd = input.command || '';
    if (/disableAllHooks/.test(cmd)) return 'disableAllHooks (turns off every guard)';
    const hit = protectedHit(cmd);
    return hit && WRITES.test(cmd) ? hit : null;
  }
  const file = input.file_path || input.notebook_path || '';
  return PROTECTED.find((p) => norm(file).endsWith(p)) || null;
}

function blockTamper(what) {
  process.stderr.write(
    `Blocked: ${what} is locked. It's part of the learning guards (docs/rules/learn-before-library.md, ` +
    `docs/rules/user-writes-core-logic.md). Claude can't change it. To change it, the user edits it by hand outside Claude.\n`);
  process.exit(2);
}

function block(names) {
  const list = [...new Set(names)].join(', ');
  process.stderr.write(
    `Blocked by docs/rules/learn-before-library.md: ${list}. It covers a core whiteboard layer we're hand-building in order to learn it.\n` +
    `To adopt it: hand-build that layer first, then write an accepted ADR (/decision new) saying what the hand-built ` +
    `version taught us and what the library adds, and include "Allow-dependency: <package>".\n`);
  process.exit(2);
}

if (process.argv[2] === 'check') {
  const s = process.argv.slice(3).join(' ');
  const ok = allowed();
  const hits = [...new Set([...fromCommand(s), ...fromSource(s), ...fromPackageJson(s)])];
  console.log(hits.length ? hits.map((h) => `${h}${ok.has(h) ? ' (allowed by ADR)' : ' BLOCKED'}`).join('\n') : 'nothing guarded');
} else {
  let raw = '';
  process.stdin.on('data', (c) => (raw += c));
  process.stdin.on('end', () => {
    let data;
    try { data = JSON.parse(raw); } catch { process.exit(0); }
    try {
      const tamper = tampering(data.tool_name, data.tool_input || {});
      if (tamper) blockTamper(tamper);
      const ok = allowed();
      const hits = inspect(data.tool_name, data.tool_input || {}).filter((n) => !ok.has(n));
      if (hits.length) block(hits);
    } catch (e) {
      process.stderr.write(`guard-deps: ${e.message}\n`);
    }
    process.exit(0);
  });
}
