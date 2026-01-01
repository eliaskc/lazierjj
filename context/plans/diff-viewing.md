# Diff Viewing & Layout

**Status**: Partial (basic diff display works)  
**Priority**: High

---

## Goals

First-class side-by-side diff support with flexible layouts that adapt to terminal size and user preference.

## Layout Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Half-width** | Diff in right panel (~60% width) | Default, side-by-side in panel |
| **Full-width** | Diff expands to full terminal | Better side-by-side view |
| **Narrow/Unified** | Single-column inline diff | Small terminals, quick scanning |

### Behavior

- **Auto-switch**: When terminal is too narrow for side-by-side, automatically switch to unified
- **Manual toggle**: Keybind to cycle modes (e.g., `v` or `+`/`-`)
- **Persist preference**: Remember last used mode in config

### Width Thresholds

```
< 80 cols   → Force unified (side-by-side unreadable)
80-120 cols → Default to unified, allow side-by-side
> 120 cols  → Default to side-by-side
```

User can override via config.

## Diff Tool Integration

Priority order:

1. **User's jj config** — If `ui.diff.tool` is set in jj config, respect it
2. **lazyjuju config** — If `[diff].tool` is set, use that
3. **Native difftastic** — Default to difftastic if available (best side-by-side)
4. **Fallback** — `jj diff --color-words` if nothing else available

### Difftastic Integration

Difftastic is ideal for side-by-side because:
- Structural diffing (understands code syntax)
- Built-in side-by-side layout
- Respects `COLUMNS` env var

```bash
# Check if difftastic available
which difft

# Run with correct width
COLUMNS=80 jj diff --tool difft
```

### Passing Width to Diff Tools

Before running any diff command:
1. Calculate available width (panel width or full terminal)
2. Set `COLUMNS` environment variable
3. Some tools also accept `--width` flag

## Keybindings

| Key | Action |
|-----|--------|
| `v` | Cycle: side-by-side → unified → side-by-side |
| `+` | Expand diff panel (half → full width) |
| `-` | Collapse diff panel (full → half width) |
| `=` | Reset to default width |

## Implementation Notes

### Current State

- Diff renders in right panel with ANSI colors
- Uses whatever jj outputs with `--color always`
- No layout switching yet

### Required Changes

1. Track layout mode in state (half/full/unified)
2. Add keybind handlers for mode switching
3. Detect terminal width changes (`useOnResize`)
4. Pass correct `COLUMNS` to jj diff
5. Add horizontal scroll for wide side-by-side diffs

### Panel Expansion

When expanding to full-width:
- Hide left panels temporarily
- Diff takes 100% width
- Press `-` or `Escape` to return to normal layout

## Tasks

- [ ] Add layout mode state (half/full/unified)
- [ ] Implement `v` toggle keybind
- [ ] Implement `+`/`-` panel expand/collapse
- [ ] Auto-detect difftastic availability
- [ ] Pass COLUMNS to diff commands
- [ ] Add horizontal scroll for wide diffs
- [ ] Add width threshold config options
- [ ] Persist layout preference
