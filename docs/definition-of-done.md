# Definition of done

`/backlog done <id>` and `/arc reconcile` check the universal gates below **plus**
the item's own section. An unmet gate blocks `done`.

## Universal gates

- [ ] Every acceptance criterion for the item is met (`docs/acceptance-criteria.md`).
- [ ] Tests for the change exist and pass; build, lint and typecheck are clean.
- [ ] No new errors or warnings in the browser console.
- [ ] If it changes shared board state: verified with two clients at once, and after a reload.
- [ ] If it adds a board operation: undo and redo work, and only affect the acting user's changes.
- [ ] If it changes the saved board format: existing boards still load (migration in place).
- [ ] Linked arc's `reconcile.md` is filled in; punted work is in the backlog.

<!-- Per-item sections go below this line: ## <id> — <slug>  (`<tag>`) -->
