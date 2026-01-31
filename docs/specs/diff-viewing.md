# Diff Viewing & Layout

**Status:** In progress. Custom renderer is in the TUI; polish and optional passthrough remain.

---

## Goals

- Consistent custom diff rendering across view and interactive modes.
- Split and unified layouts with hunk/file navigation.
- A clear path to review interactions (selection and comment anchors).

---

## Current Behavior

- Custom renderer based on `@pierre/diffs` is active in the TUI.
- Split/unified view styles exist and auto-switch by width.
- Word-level highlight and syntax highlighting are available.
- Virtualized row rendering is in place.
- Hunk and file navigation keybinds exist in the detail panel.

The renderer consumes `jj diff -r <rev> --git --ignore-working-copy` (no ANSI).

---

## Planned Enhancements

- Hunk/line selection cursor for review and split workflows.
- Diff theming in `src/theme` (remove hardcoded colors).
- Optional ANSI passthrough for difftastic/delta users.
- Panel sizing controls (`+`, `-`, `=`) and persistence.

---

## Layout Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Unified | Single-column diff | Narrow terminals |
| Split | Side-by-side old/new | Wider terminals |

---

## Optional ANSI Passthrough (future)

If we reintroduce passthrough, use `ghostty-terminal` and allow a config switch:

```
[diff]
renderer = "custom"  # or "passthrough"
passthrough_tool = "default"  # uses jj's ui.diff.tool
```

---

## Integration Points

- `specs/interactive-splitting.md` (hunk selection and execution)
- `specs/review.md` (comment anchors and navigation)

---

## References

- `specs/diff-renderer.md`
- `src/components/diff/*`
- `src/diff/*`
