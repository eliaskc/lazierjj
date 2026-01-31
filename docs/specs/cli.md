# CLI Commands

> Agent-friendly CLI for operations that jj does not expose non-interactively.

**Status:** In progress. `changes` + `comment` implemented; split and stacks pending.

---

## Philosophy

- Extend jj, do not replace it.
- Provide deterministic, addressable IDs.
- Offer JSON output for agents.
- Keep behavior explicit and composable.

---

## Entry Points

- `kajji` (no args) launches the TUI.
- `kajji <command>` runs CLI subcommands.

---

## Implemented Commands

### `kajji changes -r <revset>`

List changes with stable hunk IDs.

Options:
- `-r, --revisions` (default: `@`)
- `--json`
- `--diff` (include unified diff for each hunk)

Text output example:
```
kajji changes -r @
abc123 - "Fix config loading"
  src/utils/state.ts (M)
    h1  lines 10-25   +15 -3
    h2  lines 40-42   +2 -0
```

JSON output shape:
```
{
  "revisions": [
    {
      "changeId": "abc123",
      "commitId": "def456",
      "description": "Fix config loading",
      "files": [
        {
          "path": "src/utils/state.ts",
          "status": "modified",
          "isBinary": false,
          "hunks": [
            {
              "id": "h1",
              "oldStart": 10,
              "oldCount": 3,
              "newStart": 10,
              "newCount": 15,
              "added": 15,
              "removed": 3,
              "diff": "@@ -10,3 +10,15 @@ ..."
            }
          ]
        }
      ]
    }
  ]
}
```

### `kajji comment list -r <revset>`

List comments for matching revisions.

Options:
- `-r, --revisions` (default: `@`)
- `--json`

### `kajji comment set`

Add a comment anchored to a hunk or a line.

Required:
- `--hunk h1` OR `--file <path> --line <n>`
- `-m, --message <text>`

Optional:
- `--side new|old`
- `--author <label>` (default: `human`)
- `--type <string>` (default: `feedback`)
- `--explanation` (sets type to `explanation`)

### `kajji comment delete`

Delete by id or scoped anchor.

Options:
- `id` (positional comment id)
- `--hunk h1`
- `--file <path> [--line <n>] [--side new|old]`
- `--all` (delete all comments in revision)
- `-y, --yes` (skip confirmation)

---

## Planned Commands

### `kajji split <rev>`

Non-interactive hunk splitting, using hunk IDs from `kajji changes`.

### `kajji stack <create|list|show|sync>`

Stacked PR workflows (push + create PRs, reconciliation, status).

See `specs/github-stacking.md` for details.

---

## Implementation Notes

- Hunk IDs are sequential per revision (`h1`, `h2`, ...).
- Diff parsing uses `@pierre/diffs` via `src/diff/*`.
- Comments are stored locally in `~/.local/state/kajji/repos/<hash>/comments.json`.

---

## Non-goals

Do not wrap jj commands that already work well non-interactively:
- `jj diff`, `jj log`, `jj rebase`, `jj describe`, `jj new`, `jj squash`
- `jj split` for file-level splitting (kajji only adds hunk-level)

---

## Related Specs

- `specs/review.md` (comments and anchors)
- `specs/interactive-splitting.md` (split mode UX)
- `specs/github-stacking.md` (stack workflows)
