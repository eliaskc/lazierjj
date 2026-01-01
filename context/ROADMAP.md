# lazyjuju - Roadmap

> Features and improvements planned for implementation.
>
> For current state, see [STATUS.md](./STATUS.md).

---

## Priorities

### High Priority

| Area | Description | Plan |
|------|-------------|------|
| **Core Operations** | `new`, `edit`, `describe`, `squash`, `abandon` | [Details below](#core-operations) |
| **Performance** | Profile and fix lag in bookmarks navigation | [Details below](#performance-investigation) |
| **Command Palette** | Unified help + command execution | [Details below](#command-palette) |
| **Mouse Support** | Click to focus, scroll, double-click actions | — |
| **Configuration** | User config file, theme selection, custom keybinds | [plans/configuration.md](./plans/configuration.md) |

### Medium Priority

| Area | Description | Plan |
|------|-------------|------|
| **Keybindings** | Context-aware keybinds, status bar visibility | [plans/keybindings.md](./plans/keybindings.md) |
| **Diff Viewing** | Side-by-side, layout modes, difftastic integration | [plans/diff-viewing.md](./plans/diff-viewing.md) |
| **Release Flows** | bunx, Homebrew, npm publishing | [plans/release-flows.md](./plans/release-flows.md) |
| **Auto-Refresh** | Watch filesystem, refresh on changes | — |

### Nice-to-Have

| Area | Description |
|------|-------------|
| Search & Filter | `/` to filter log by description/change ID |
| Command Mode | `:` to run arbitrary jj commands |
| Undo/Redo | `u` / `Ctrl+r` with confirmation |
| Git Push/Fetch | `P` / `f` for remote operations |
| Oplog View | View and restore from operation history |

---

## Core Operations

The essential jj operations to make lazyjuju useful for daily work.

| Key | Operation | Behavior |
|-----|-----------|----------|
| `n` | `jj new` | Create new change. No confirmation. |
| `e` | `jj edit` | Edit selected change. No confirmation. |
| `d` | `jj describe` | Opens describe modal. |
| `s` | `jj squash` | Squash into parent. No confirmation. |
| `a` | `jj abandon` | Abandon change. **Requires confirmation.** |

### Describe Modal

```
┌─ Describe ─────────────────────────── Enter: save | Esc: cancel ─┐
│ ┌─ Subject ─────────────────────────────────────────────────────┐ │
│ │ feat: add new feature                                         │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ ┌─ Body ────────────────────────────────────────────────────────┐ │
│ │                                                               │ │
│ └───────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

- Pre-fills with existing description
- Tab switches between subject and body
- Enter in subject saves, Enter in body is newline

### Confirmation Modal

For destructive operations (abandon, undo):
- Show commit description
- `y` or Enter = confirm
- `n` or Escape = cancel

---

## Performance Investigation

Noticeable lag when navigating commits in bookmarks panel.

**Suspected causes:**
- Diff rendering (ANSI parsing via ghostty-opentui)
- Frequent re-renders during navigation
- Debouncing may not be aggressive enough

**Investigation steps:**
1. Static analysis first — trace the code path for navigation events
2. Profile with `bun --inspect` or console timing
3. Identify hot paths (diff loading? ANSI parsing? rendering?)
4. Consider: memoization, virtualization, or async loading patterns

**Success criteria:** Navigation feels instant (<50ms perceived lag)

---

## Command Palette

Unify help modal and command execution into one interface.

**Trigger**: `?` (or `Ctrl+P`)

**Behavior**:
- Shows all available commands with keybindings
- Type to filter
- Enter executes selected command
- Commands without keybinds accessible here too

**Why unified**: One UI to learn, all actions discoverable in one place.

---

## Theme System

### ✅ Phase 1: Two Themes (Done)

- lazygit theme (green accent, rounded borders)
- opencode theme (peach accent, single borders)
- Hardcoded toggle in code

### Phase 2: Theme Switching

- Command palette or config to switch themes
- Persist selection

### Phase 3: More Themes

- Popular themes: tokyonight, catppuccin, gruvbox, nord
- Custom theme loading from config

---

## UI Polish

Quick wins:

- [ ] `?` should toggle (also close) help modal
- [ ] Log/bookmark panels slightly wider
- [ ] Rich commit details (full message + file stats)

---

## Future Ideas

Longer-term possibilities, not planned for near-term:

- Command mode autocomplete
- PR status indicator in bookmark list
- Conflict visualization
- Revset filtering
- Multi-select for batch operations
- Interactive rebase UI
- Stacked PRs support
- Large repo optimization (10k+ commits)

---

## Reference

- [STATUS.md](./STATUS.md) — Current state, what works, known issues
- [archive/lazyjj-plan.md](./archive/lazyjj-plan.md) — Original full specification
- [references/](./references/) — Analysis of jjui, lazyjj, opencode patterns
