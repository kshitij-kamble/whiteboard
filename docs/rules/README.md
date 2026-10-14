# Rules

Standing instructions for working on this project, one rule per file. Managed
with `/rules`; matched and injected by hooks via `.claude/scripts/rules-match.mjs`.

A rule is for guidance that should apply **every time** a topic comes up
("always X when touching Y"). One-off choices with trade-offs are ADRs
(`docs/adr/`, see `/decision`), not rules.

## Files

- `docs/rules/<id>.md` — the filename (minus `.md`) is the rule's id. Kebab-case.
- `_template.md` and this README are ignored by the matcher.

## Frontmatter

| Field | Required | Values | Meaning |
|---|---|---|---|
| `title` | yes | text | One line, imperative. |
| `scope` | yes | `global` · `canvas` · `sync` · `storage` · `ui` · `process` | Area of the project. Used to filter `/rules list`. Add a new scope here before using it. |
| `priority` | yes | `must` · `should` | `must` titles load at session start; use only where breaking the rule causes real harm. |
| `status` | yes | `active` · `deprecated` | Hooks skip deprecated rules. |
| `appliesToKeywords` | yes | list | Words that should trigger the rule. Whole-word, case-insensitive. |
| `appliesToPaths` | no | list of globs | Repo-rooted globs (`src/sync/**`). Used by `/rules check <path>` only; no hook reads them yet. |
| `supersedes` | no | list of ids | Rules this one replaces. |

Lists can be inline (`[a, b]`) or block (`- a` on following lines). Only this
simple subset of YAML is parsed.

## Body

A `**Why:**` paragraph first, then the rule as short imperative bullets.
Retired rules keep their body and get a `**Retired YYYY-MM-DD:** <reason>` line
at the end.

## Loading

| When | What's injected |
|---|---|
| Session start | id + title of every active `must` rule |
| Each prompt | full body of every active rule with a keyword in the prompt |
