# Focus Modes

**Status:** In progress. Normal + Diff exist; layout evolution pending.

---

## Goals

- Fast layout switching without losing context.
- Keep the default layout stable and predictable.
- Provide a path to review-focused layouts without forcing mode bloat.

---

## Current Behavior

- Normal mode (balanced layout) exists.
- Diff mode exists with expanded diff and reduced sidebar.
- `ctrl+x` toggles or opens a mode picker (depending on implementation depth).
- Minimal commit header is used in file tree contexts.

---

## Candidate Layouts

**Rethinking the split direction:**

Current layout is left/right (log | diff). But width matters more than height for both panels:
- Log: graph + metadata + description benefits from horizontal space
- Diff: code is wide, vertical space is cheap (scroll)

**Idea: top/bottom as primary layout**
```
┌─────────────────────────────────┐
│            Log Panel            │
├─────────────────────────────────┤
│           Diff Panel            │
└─────────────────────────────────┘
```

Maybe `ctrl+x` toggles between:
- **Horizontal split** (top/bottom) — log above, diff below. Both get full width.
- **Vertical split** (left/right) — current 50/50 or ratio variants.

Needs experimentation to see if this actually feels better.

**Review layout (probably left/right):**
```
┌──────────┬──────────────────────────┐
│  Files   │                          │
├──────────┤        Diff              │
│ Comments │                          │
└──────────┴──────────────────────────┘
```

When in review context, log probably morphs to files + comments (stacked left), diff stays right. This might be the one case where left/right split is better — files/comments are narrow lists, diff needs width. TBD.

| Mode | Split | Left/Top | Right/Bottom |
|------|-------|----------|--------------|
| Normal | horizontal? | log | diff |
| Classic | vertical | log | diff |
| Review | vertical? | files + comments | diff |

PR mode is not planned. If review needs a dedicated layout, treat it as a review overlay, not a full PR system.

---

## Review UX (Open)

We need a way to emphasize diff + comments without creating too many modes.

Options:
- **Review overlay:** Show comments panel below log while staying in Normal/Diff.
- **Zoom (`z`)**: Full-screen the focused panel (diff or comments) and toggle back.
- **Review mode:** Separate mode only if overlay/zoom are not enough.
- **Enter-to-review:** When diff is focused, `Enter` enables line selection and swaps bookmarks for the comments panel. This could be a local UI state or a named mode reachable via `ctrl+x`.

Recommendation: start with overlay + zoom and avoid adding another global mode unless needed.

---

## Auto-switch (Decided against)

Auto-switch to Diff on file tree entry is jarring. Prefer explicit user control via `ctrl+x` or `z`.

---

## Mode Indicator

Mode label in the status bar should remain, but be subtle for Normal and more visible for non-default states.

---

## Open Questions

1. Should `ctrl+x` remain a toggle for now, or always open a picker?
2. Do we need a dedicated review layout once comments land, or can overlay + zoom cover it?
3. Where should a comments panel live when diff is zoomed?
4. Does horizontal (top/bottom) become the new default, or stay opt-in?

---

## Related Specs

- `specs/review.md` (comments panel and review UX)
- `specs/diff-viewing.md` (diff layout and navigation)
