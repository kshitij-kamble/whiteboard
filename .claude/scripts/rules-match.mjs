#!/usr/bin/env node
// Loads rules from docs/rules/*.md and matches them against prompts and paths.
//
//   node .claude/scripts/rules-match.mjs --session          print active `must` rules (SessionStart hook)
//   node .claude/scripts/rules-match.mjs --prompt           read hook JSON on stdin, print matching rule bodies (UserPromptSubmit hook)
//   node .claude/scripts/rules-match.mjs list [scope]       table of rules, optionally filtered by scope
//   node .claude/scripts/rules-match.mjs check <text|path>  which rules would match, and why
//
// Hook modes never fail a turn: errors go to stderr and exit 0.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RULES = path.join(ROOT, 'docs', 'rules');

const read = (f) => { try { return fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { return ''; } };
const listDir = (d) => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; } };

// Minimal YAML subset: `key: value`, `key: [a, b]`, and block lists (`key:` then `  - a`).
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  let listKey = null;
  const unquote = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
  for (const line of m[1].split('\n')) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) { meta[listKey].push(unquote(item[1])); continue; }
    const kv = line.match(/^(\w[\w-]*):\s*(.*?)\s*$/);
    if (!kv) continue;
    const [, key, val] = kv;
    listKey = null;
    if (val === '') { meta[key] = []; listKey = key; }
    else if (val.startsWith('[')) meta[key] = val.replace(/^\[|\]$/g, '').split(',').map(unquote).filter(Boolean);
    else meta[key] = unquote(val);
  }
  return { meta, body: text.slice(m[0].length).trim() };
}

function loadRules() {
  return listDir(RULES)
    .filter((d) => d.isFile() && d.name.endsWith('.md') && !d.name.startsWith('_') && d.name !== 'README.md')
    .map((d) => {
      const { meta, body } = parseFrontmatter(read(path.join(RULES, d.name)));
      const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []);
      return {
        id: d.name.replace(/\.md$/, ''),
        title: meta.title || d.name,
        scope: meta.scope || 'global',
        priority: meta.priority === 'must' ? 'must' : 'should',
        status: meta.status || 'active',
        keywords: arr(meta.appliesToKeywords),
        paths: arr(meta.appliesToPaths),
        body,
      };
    })
    .sort((a, b) => (a.priority === b.priority ? a.id.localeCompare(b.id) : a.priority === 'must' ? -1 : 1));
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word, case-insensitive: `test` matches "run the test" but not "latest".
const keywordHits = (rule, text) => rule.keywords.filter((k) => new RegExp(`(?<![\\w])${escape(k)}(?![\\w])`, 'i').test(text));

function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { re += glob[i + 2] === '/' ? '(?:.*/)?' : '.*'; i += glob[i + 2] === '/' ? 2 : 1; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += escape(c);
  }
  return new RegExp(`^${re}$`);
}
const toRepoPath = (p) => path.relative(ROOT, path.resolve(ROOT, p)).replace(/\\/g, '/');
const pathHits = (rule, p) => rule.paths.filter((g) => globToRegex(g).test(toRepoPath(p)));

const active = (r) => r.status !== 'deprecated';
const render = (r) => `### ${r.title} (\`${r.id}\`, ${r.priority})\n\n${r.body}`;

function session() {
  const must = loadRules().filter((r) => active(r) && r.priority === 'must');
  if (!must.length) return;
  console.log([
    'Project rules marked `must` (docs/rules/). Bodies load when a prompt matches; read the file if one applies before then.',
    '',
    ...must.map((r) => `- \`${r.id}\` — ${r.title}`),
  ].join('\n'));
}

function prompt() {
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { /* no stdin or not JSON */ }
  const text = input.prompt || '';
  const hits = loadRules().filter((r) => active(r) && keywordHits(r, text).length);
  if (!hits.length) return;
  console.log(['Project rules matching this prompt (docs/rules/):', ...hits.map(render)].join('\n\n'));
}

function list(scope) {
  const rules = loadRules().filter((r) => !scope || r.scope === scope);
  if (!rules.length) { console.log(scope ? `No rules with scope "${scope}".` : 'No rules yet.'); return; }
  console.log(['| id | scope | priority | status | title |', '|---|---|---|---|---|',
    ...rules.map((r) => `| ${r.id} | ${r.scope} | ${r.priority} | ${r.status} | ${r.title} |`)].join('\n'));
}

function check(arg) {
  const rules = loadRules();
  const rows = rules.map((r) => {
    const why = [...keywordHits(r, arg).map((k) => `keyword "${k}"`), ...pathHits(r, arg).map((g) => `path ${g}`)];
    return { r, why };
  }).filter((x) => x.why.length);
  if (!rows.length) { console.log('No rules match.'); return; }
  for (const { r, why } of rows) {
    const note = active(r) ? '' : ' — deprecated, hooks skip it';
    console.log(`- \`${r.id}\` (${r.priority}): ${why.join(', ')}${note}`);
  }
  console.log('\nNote: hooks inject on keyword matches only; path matching is used by /rules check.');
}

const [cmd, ...rest] = process.argv.slice(2);
const hook = cmd === '--session' || cmd === '--prompt';
try {
  if (cmd === '--session') session();
  else if (cmd === '--prompt') prompt();
  else if (cmd === 'list') list(rest[0]);
  else if (cmd === 'check' && rest.length) check(rest.join(' '));
  else { console.error('Usage: rules-match.mjs --session | --prompt | list [scope] | check <text|path>'); process.exit(2); }
} catch (err) {
  console.error(`rules-match: ${err.message}`);
  process.exit(hook ? 0 : 2);
}
