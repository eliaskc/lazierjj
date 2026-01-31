# Code Review

> Local-first review with hunk- and line-anchored comments. Agents and humans on equal footing.

**Status:** In progress. CLI foundation exists; TUI comments panel pending.

---

## Goals

- Local-first comments tied to concrete diff anchors.
- CLI access for agents and scripts.
- TUI panel view for human review (panel first, inline later).

## Non-goals (for now)

- Full PR management inside kajji.
- Auto-pushing local comments to GitHub.

---

## Current State (Implemented)

**CLI:**
- `kajji changes` lists hunks with stable IDs.
- `kajji comment list|set|delete` supports hunk and line anchors.

**Storage:**
- Comments live in `~/.local/state/kajji/repos/<repo-hash>/comments.json`.
- Comments are keyed by change ID and store anchors + comments.

**Relocation:**
- When a change ID points to a new commit hash, comments are relocated against the new diff and stale anchors are marked.

---

## Anchor Model

Single anchor shape for hunks and lines. Both include context lines for relocation.

### Hunk anchor

```
{
  "id": "h1",
  "type": "hunk",
  "filePath": "src/utils/state.ts",
  "lineRange": {
    "oldStart": 42,
    "oldCount": 2,
    "newStart": 105,
    "newCount": 22
  },
  "contextLines": [
    "export function writeState(state: AppState): void {",
    "const statePath = getStatePath()",
    "writeFileAtomic(statePath, JSON.stringify(state, null, 2))"
  ],
  "stale": false,
  "comments": [
    {
      "id": "cmt_abc123",
      "text": "Why not early return?",
      "author": "human",
      "type": "feedback",
      "createdAt": "2026-01-25T10:30:00Z",
      "replyTo": null
    }
  ]
}
```

### Line anchor

```
{
  "id": "l_9f2a1c3b",
  "type": "line",
  "filePath": "src/utils/state.ts",
  "lineNumber": 108,
  "side": "new",
  "contextLines": [
    "const configPath = getConfigPath()",
    "writeFileAtomic(configPath, JSON.stringify(config, null, 2))"
  ],
  "stale": false,
  "comments": [
    {
      "id": "cmt_def456",
      "text": "This line is the critical migration point.",
      "author": "agent",
      "type": "explanation",
      "createdAt": "2026-01-25T10:31:00Z",
      "replyTo": null
    }
  ]
}
```

Notes:
- `side` is optional for local-only line anchors.
- `contextLines` are used to relocate anchors after edits.

---

## Comment Entry

```
{
  "id": "cmt_abc123",
  "text": "Why not early return?",
  "author": "human",
  "type": "feedback",
  "createdAt": "2026-01-25T10:30:00Z",
  "replyTo": null
}
```

Types are open-ended strings; `feedback` and `explanation` are the defaults.

---

## CLI Surface (Current)

### `kajji changes -r <revset>`

Lists hunks with IDs. Supports `--json` and `--diff`.

### `kajji comment list -r <revset>`

Lists comments for matching revisions. Supports `--json`.

### `kajji comment set`

- `--hunk h1` or `--file <path> --line <n>`
- Optional `--side new|old` for line anchors
- `--message`, `--author`, `--type`, `--explanation`

### `kajji comment delete`

- By id: `kajji comment delete cmt_abc123`
- Or scoped: `--hunk`, `--file/--line`, `--file`, `--all`

---

## TUI Plan

### Phase 1: Comments Panel (no inline)

**Review layout probably uses vertical (left/right) split:**

Unlike the main log+diff view (which may move to horizontal/top-bottom split for width), review likely keeps left/right because files and comments are narrow lists that don't need width — diff needs it. TBD.

```
┌──────────┬──────────────────────────┐
│  Files   │                          │
├──────────┤        Diff Panel        │
│ Comments │                          │
└──────────┴──────────────────────────┘
```

Log would morph to files + comments (stacked left) when entering review context.

Initial behavior:
- Panel only (no inline rendering yet).
- Comment count indicators in diff gutter or hunk header.
- `c` to add comment on current hunk/line.

Exploratory interaction pattern:
- Focus diff, press `Enter` to enter a comment review state.
- In this state, lines become selectable and the comments panel replaces bookmarks.
- This could be a Review mode, a variant of Diff mode (via `ctrl+x`), or a local UI state toggled by `Enter` without changing global mode.

Mouse selection entry:
- Mouse text selection in diff should select whole lines, not raw text.
- Selection should skip unmodified context line gaps (only select changed lines).
- Selecting lines automatically enters review state and shows the comments panel.
- This provides a low-friction entry point for review without learning keybinds first.

### Inline comments (future)

Inline rendering below the anchor line is possible later, but it requires variable-height diff rows and more complex virtualization. Keep it optional.

---

## Navigation Requirements

To support review and comments, diff navigation needs:
- Hunk navigation (`[`/`]` or `n`/`N`).
- Line selection or hunk selection cursor.
- A way to jump from a comment to its anchor.

These should work in normal view without forcing a new global mode.

---

## Modes vs Zoom (Open)

Open question for review UX:

Option A: Review mode
- Dedicated layout (diff + comments panel emphasized).

Option B: Zoom
- `z` toggles full-screen for focused panel.
- Review overlay inside the diff panel (comments panel below or as a side drawer).

We can support both, but the default should stay lightweight.

---

## GitHub Sync (Deferred)

If needed later, we can add read-only import of PR comments to address feedback locally. No push by default.

---

## Implementation Phases

### Phase 0: CLI foundation (done)
- `kajji changes` with hunk IDs, JSON output, and `--diff`.

### Phase 1: Local comments CLI (done)
- `kajji comment list|set|delete` with hunk and line anchors.
- Local storage with relocation and stale marking.

### Phase 2: TUI comments panel
- Comment list panel below log.
- Add comment modal from diff.
- Comment count indicators in diff.

### Phase 3: Review navigation polish
- Hunk/line selection cursor.
- Jump from comment to anchor and back.

### Phase 4: Optional GitHub import
- Read-only PR comment import if demand exists.

---

## Decisions

- Storage: `~/.local/state/kajji/repos/<hash>/comments.json`.
- Panel-first UI; inline comments are future work.
- Local-first; GitHub sync is optional and read-only.

---

## References

- `src/comments/*` for storage and relocation logic.
- `src/cli/comment.ts` for CLI surface.
- `src/diff/*` for hunk IDs and line anchors.
- [critique](https://critique.work) for local-first review inspiration.
