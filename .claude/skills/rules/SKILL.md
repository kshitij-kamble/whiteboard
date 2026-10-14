---
name: rules
description: List, inspect, author, and check rules in docs/rules/. Use for /rules, and suggest adding one (once) when the user gives standing guidance ("always…", "never…", "from now on…") or a reconcile surfaces a lesson.
---

# /rules

Rules live as one `.md` per file in `docs/rules/`, each with frontmatter. See
`docs/rules/README.md` for the frontmatter contract, valid `scope` values and
loading semantics. Matching is done by `.claude/scripts/rules-match.mjs`. Use
it rather than matching by eye.

## Subcommands

| Form | Behavior |
|---|---|
| `/rules` | Same as `/rules list`. |
| `/rules list [scope]` | `node .claude/scripts/rules-match.mjs list [scope]` |
| `/rules show <id>` | Print `docs/rules/<id>.md` (frontmatter + body). |
| `/rules new <slug>` | Copy `docs/rules/_template.md` → `<slug>.md`, then fill it in (below). |
| `/rules check <text-or-path>` | `node .claude/scripts/rules-match.mjs check "<text-or-path>"`: which rules match, and on what. |
| `/rules why <id>` | Print just the **Why** paragraph. |
| `/rules promote <id>` | Set `priority: must`. |
| `/rules retire <id> <reason>` | Set `status: deprecated`, append `**Retired YYYY-MM-DD:** <reason>`. |
| `/rules supersede <old-id> <new-slug>` | `/rules new <new-slug>` with `supersedes: [old-id]`; retire the old one with reason "superseded by `<new-slug>`". |

For everything else (add keyword, add path, demote, tweak wording), edit the
rule file directly. The skill's job is state transitions and lookup, not
line-editing convenience.

## Authoring flow

1. `/rules new <slug>` copies the template. The slug is the id: kebab-case, no
   prefix.
2. Fill in the frontmatter from the conversation; ask only for what you can't
   infer. `priority: must` only if violating it would cause real harm;
   otherwise `should`. `scope` must be one listed in the README.
3. `appliesToKeywords`: verbs and nouns the user or code would actually use.
   Not synonyms of the rule title. Prefer distinctive words (`websocket`,
   `z-order`) over generic ones (`fix`, `change`), which fire on every prompt.
4. `appliesToPaths` (optional): globs, not regex. Rooted at repo.
5. Body: **Why** paragraph + imperative content. Trim aggressively.
6. Run `/rules check "<a prompt that should trigger it>"` to confirm it fires.

## Matching semantics (what the hooks do)

Hooks in `.claude/settings.json` run the matcher:

- **SessionStart** (`--session`): ids + titles of active `must` rules.
- **UserPromptSubmit** (`--prompt`): full bodies of active rules where ANY
  `appliesToKeywords` entry appears in the prompt. Whole-word,
  case-insensitive: `test` matches "run the test", not "latest".
- **File paths:** not read by any hook yet. `/rules check <path>` matches a rule
  if ANY glob in `appliesToPaths` matches the path.
- **Deprecated** rules are never injected; `check` still lists them, flagged.
