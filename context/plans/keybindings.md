# Keybinding System Improvements

**Status**: Partially implemented (registry exists, context awareness needed)  
**Priority**: High

---

## Current State

- Command registry exists with keybinds, contexts, and categories
- All keybinds are effectively global
- Status bar shows hints
- Help modal shows all commands

## Improvements Needed

### 1. Context-Aware Keybinds

Keybinds should be scoped to panels (log, bookmarks, diff, etc.):
- Same key can do different things in different panels
- Example: `d` = describe in log panel, delete in bookmarks panel

### 2. Status Bar Visibility Control

Each keybind should have a `showInStatusBar: boolean` property:
- Important keybinds shown by default
- Navigation keybinds (j/k/g/G) hidden to reduce noise
- User can override in config

### 3. Help Modal Integration

- Filter commands by current context
- Show/hide based on visibility property
- Group by category
- Execute command on Enter (not just view)

## Proposed Command Interface

```typescript
interface Command {
  id: string
  title: string
  keybind: string
  context: "global" | "log" | "bookmarks" | "diff" | "files" | "modal"
  category: string
  onSelect: () => void
  // New properties:
  showInStatusBar?: boolean  // default: true
  showInHelp?: boolean       // default: true
}
```

## Tasks

- [ ] Add context scoping to keybind matcher
- [ ] Add `showInStatusBar` and `showInHelp` to Command interface
- [ ] Update status bar to filter by visibility
- [ ] Update help modal to filter by context and visibility
- [ ] Add keybind customization to config schema
