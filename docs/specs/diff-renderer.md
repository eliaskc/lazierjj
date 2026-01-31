# Custom Diff Renderer

**Status:** In progress. Core renderer exists; review/split overlays remain.

---

## Goals

- Single renderer for view, split, and review workflows.
- Stable identifiers for hunks and lines.
- Fast rendering with virtualization.

---

## Current Implementation

Already in the codebase:

- Parsing via `@pierre/diffs` (`src/diff/parser.ts`).
- Stable IDs (`src/diff/identifiers.ts`).
- Flattened rows + virtualization (`src/diff/virtualization.ts`).
- Syntax highlighting worker (`src/diff/syntax.ts`).
- Word-level diff (`src/diff/word-diff.ts`).
- Virtualized split/unified views (`src/components/diff/*`).
- Main TUI uses custom renderer in `src/components/panels/MainArea.tsx`.

---

## Missing Pieces

- Selection cursor for hunk/line targeting.
- Inline markers for comment anchors.
- Split selection overlay state (keep/split per hunk).
- Diff theming via `src/theme`.
- Optional ANSI passthrough (if reintroduced).

---

## Anchor Requirements

- Hunk IDs must be stable across filtering and file reordering.
- Line anchors should include `filePath`, `lineNumber`, optional `side`.
- Row model should carry `fileId`, `hunkId`, and `side` for annotation mapping.

See `specs/review.md` for anchor storage format.

---

## Rendering Strategy

- Keep virtualized row rendering for speed.
- Avoid inline comment rendering until variable-height virtualization is solved.
- Prefer a panel-based comments UI first.

---

## Future Enhancements

- Optional file-at-a-time diff view for review flows.
- Hunk navigation with visible cursor state.
- Diff theming tokens in `src/theme`.

---

## References

- `specs/diff-viewing.md`
- `specs/interactive-splitting.md`
- `specs/review.md`
