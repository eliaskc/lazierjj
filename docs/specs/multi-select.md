# Multi-Select

> Visual selection for batch operations on commits.

---

## Concept

Hybrid selection model combining vim-style range selection with toggle selection:

- **`v`** — enter visual mode, `j`/`k` extends range from anchor
- **`space`** — toggle individual item (works in or out of visual mode)
- **`Escape`** — exit visual mode, keep selections
- **`Escape Escape`** — clear all selections

This applies to:
- **Log panel** — select multiple commits
- **Bookmarks panel** — multiple commits when drilled into a bookmark

---

## Selection Model

### Visual Contiguity

Selection is **visually contiguous** — whatever looks contiguous in the log view is selectable together. No ancestry validation (simpler, predictable).

### Hybrid Selection (v + space)

Both range and toggle selection are supported:

| Key | Behavior |
|-----|----------|
| `v` | Enter visual mode, anchor at cursor |
| `j`/`k` (in visual) | Extend selection from anchor to cursor |
| `space` | Toggle single item (in or out of visual mode) |
| `Escape` | Exit visual mode, keep selections |
| `Escape Escape` | Clear all selections |

**Example flow:**
```
Normal → v (anchor) → j j j (select 4) → Escape (exit visual, keep 4)
→ k (move without changing selection) → space (deselect one) → s (squash 3)
```

### Live Diff Feedback

While commits are selected, the diff panel shows **combined diff** of all selected revisions. Updates in real-time as selection changes. Immediate feedback on "what am I about to operate on."

### Operation Compatibility

| Command | Multi-select | Notes |
|---------|--------------|-------|
| `r` rebase | Yes | Opens modal with target picker |
| `s` squash | Yes | Opens modal with target picker |
| `c` / `P` stack | Yes | Opens stack editor |
| `a` abandon | Yes | Confirmation dialog |
| `Ctrl+Y` copy | Yes | Copy all change IDs |
| `d` describe | No | Single commit only |
| `e` edit | No | Single working copy |
| `n` new | No | Single commit only |

---

## UX Flow

1. **Normal mode**: Single item selected (current behavior)
2. **Press `v`**: Enter visual mode, anchor at current item
3. **Navigate `j`/`k`**: Selection extends from anchor to cursor
4. **`space`**: Toggle individual items (works anytime)
5. **Perform action**: Execute command on all selected items
6. **`Escape`**: Exit visual mode, keep selections
7. **`Escape Escape`**: Clear all selections, return to normal

### Visual Feedback

- Selected items: highlighted background
- Anchor item (in visual mode): subtle indicator (e.g., underline)
- Status bar: shows count (e.g., "3 selected") and available operations
- Diff panel: combined diff of all selected commits (live updates)

---

## Command Registry

```typescript
interface Command {
  // ... existing fields
  multiSelect?: boolean  // Default: false. If true, command works with visual selection.
}
```

When items are selected (N > 1):
- Commands with `multiSelect: false` are dimmed in help modal
- Attempting to invoke them shows brief error or does nothing
- Status bar shows only multi-select compatible commands

### jj Commands

```bash
# Squash range into target
jj squash --from <first>::<last> --into <target>

# Rebase range onto target  
jj rebase -r <first>::<last> -d <target>

# Abandon multiple
jj abandon <id1> <id2> <id3>
```

### Related: Operation Modals

For rebase and squash operations, see rebase-squash-modal (archived in vault: `~/oh-yeah/Projects/kajji/archive/rebase-squash-modal.md`) for the dual-pane modal design with target picker and operation flags.

---

## Implementation Notes

### State

```typescript
interface SelectionState {
  visualMode: boolean           // Whether v-mode is active (range extension)
  anchor: string | null         // Change ID where v was pressed
  selected: Set<string>         // All selected change IDs (from range + toggles)
}
```

### Selection Logic

```typescript
// In visual mode, selection is anchor→cursor range + any toggles
function getSelected(state: SelectionState, cursor: string, items: string[]): Set<string> {
  if (!state.visualMode) {
    return state.selected
  }
  
  // Range from anchor to cursor
  const anchorIdx = items.indexOf(state.anchor!)
  const cursorIdx = items.indexOf(cursor)
  const start = Math.min(anchorIdx, cursorIdx)
  const end = Math.max(anchorIdx, cursorIdx)
  const range = new Set(items.slice(start, end + 1))
  
  // Merge with explicit toggles
  return new Set([...range, ...state.selected])
}

// Space toggle - works in or out of visual mode
function toggleItem(state: SelectionState, item: string): SelectionState {
  const selected = new Set(state.selected)
  if (selected.has(item)) {
    selected.delete(item)
  } else {
    selected.add(item)
  }
  return { ...state, selected }
}
```

---

## Edge Cases

- **Empty selection**: If selected items are deleted/moved, remove them from selection
- **Panel switch**: Exiting panel clears selection (or keep? TBD)
- **Scroll**: Large selections may extend beyond viewport — ensure cursor stays visible
- **Escape timing**: Double-escape to clear requires tracking escape presses (debounce ~300ms)

---

## Future Scope

- **File tree multi-select** — mark multiple files for `jj split` operations
- **Select all** (`V` or `ggVG`)
- **Mouse drag selection**

---

## Priority

Medium effort | High impact

Depends on: Core operations being implemented first (need commands to batch)

Enables: Stack creation flow (uses contiguous multi-select)
