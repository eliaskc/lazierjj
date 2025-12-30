# Future Improvements - lazierjj

> Improvements identified but deferred for later phases.
> Based on analysis of opencode, jjui, lazyjj, and OpenTUI patterns.

---

## 1. Theme System Evolution

**Current state**: Hardcoded hex colors scattered across components.

### Phase 1: Simple Token File (MVP)

```
src/theme/
├── colors.ts      # Semantic token constants
└── index.ts       # Re-export
```

```typescript
// colors.ts - Single dark theme, no runtime switching
export const colors = {
  // Borders
  borderFocused: "#4ECDC4",
  borderDefault: "#444444",
  
  // Selection
  selectionBg: "#283457",
  
  // Text
  textPrimary: "#c0caf5",
  textMuted: "#565f89",
  textAccent: "#7aa2f7",
  textAuthor: "#e0af68",
  textTimestamp: "#9ece6a",
  
  // Status
  success: "#9ece6a",
  warning: "#e0af68",
  error: "#f7768e",
} as const
```

**Benefits**: Zero runtime overhead, simple imports, catches all hardcoded colors.

### Phase 2: Theme Context (Post-MVP)

When users request light mode or custom themes:

```
src/theme/
├── colors.ts         # Token type definitions
├── themes/
│   ├── tokyo-night.ts
│   ├── catppuccin.ts
│   └── system.ts     # Generated from terminal palette
├── context.tsx       # ThemeProvider + useTheme hook
└── index.ts
```

```typescript
// context.tsx
interface Theme {
  name: string
  colors: ThemeColors
}

const ThemeContext = createContext<Theme>()

export function ThemeProvider(props: { children: JSX.Element }) {
  const [theme, setTheme] = createSignal<Theme>(tokyoNight)
  
  // Optional: Detect light/dark from terminal via OSC 11
  onMount(async () => {
    const isDark = await detectTerminalBackground()
    if (!isDark) setTheme(lightTheme)
  })
  
  return (
    <ThemeContext.Provider value={theme()}>
      {props.children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be within ThemeProvider")
  return ctx
}
```

```typescript
// Usage in components
const theme = useTheme()
<box borderColor={theme.colors.borderFocused} />
```

### Phase 3: Terminal-Aware System Theme (Optional)

Pattern from opencode - query terminal for its palette:

```typescript
// Query terminal background color via OSC 11
async function detectTerminalBackground(): Promise<boolean> {
  // Send: \x1b]11;?\x07
  // Parse response to get background color
  // Return true if dark (luminance < 0.5)
}

// Generate theme from terminal's 16-color palette
function generateSystemTheme(palette: TerminalPalette): Theme {
  return {
    name: "system",
    colors: {
      borderFocused: palette.cyan,
      textPrimary: palette.foreground,
      // ... map palette to semantic tokens
    }
  }
}
```

**When to implement**: When users report theme clashes with their terminal.

---

## 2. Context Decomposition

**Current**: `sync.tsx` handles everything (log, selection, diff, focus).

**Proposed Split**:
```
src/context/
├── log.tsx       # commits, loading, error, loadLog()
├── selection.tsx # selectedIndex, selectNext/Prev/First/Last
├── diff.tsx      # diff, diffLoading, diffError, loadDiff()
├── focus.tsx     # focusedPanel, toggleFocus()
└── index.tsx     # Re-exports or combined provider
```

**Why defer**: Current size is manageable (~150 LOC). Split when adding more state (bookmarks, oplog, etc.).

---

## 3. Keyboard Architecture

**Current**: Monolithic switch statement in `App.tsx`.

**Options**:

### Option A: Per-Panel Handlers
```typescript
// Each panel handles its own keys
function LogPanel() {
  useKeyboard((evt) => {
    if (!isFocused()) return
    switch (evt.name) {
      case "j": selectNext(); break
      case "k": selectPrev(); break
    }
  })
}
```

### Option B: Keymap Registry (like opencode)
```typescript
// Central registry with context-aware routing
const { registerKey } = useKeymap()

registerKey({
  key: "n",
  context: "log",
  action: () => createNewChange(),
  description: "Create new change"
})
```

### Option C: Leader Key Pattern (like jjui/opencode)
```typescript
// Multi-key sequences for complex commands
// leader → r → m = rebase to main
const [leader, setLeader] = createSignal(false)
```

**Recommendation**: Start with Option A (simplest), migrate to B when adding command palette.

---

## 4. Directory Structure Evolution

**Current**:
```
src/
├── commander/
├── components/
│   └── panels/
├── context/
├── App.tsx
└── index.tsx
```

**Proposed** (when project grows):
```
src/
├── commander/        # jj CLI wrappers
├── components/
│   ├── common/       # Button, Input, Modal, etc.
│   ├── panels/       # LogPanel, DiffPanel, etc.
│   └── modals/       # DescribeModal, ConfirmModal
├── context/          # State providers
├── theme/            # Colors, tokens, ThemeProvider
├── hooks/            # useKeymap, useFocus, useDebounce
├── lib/              # Utilities (stripAnsi, etc.)
├── App.tsx
└── index.tsx
```

---

## 5. Command Palette

**Pattern from opencode**:

```typescript
// Components register commands
const { registerCommand } = useCommand()

onMount(() => {
  registerCommand({
    id: "change.new",
    label: "New Change",
    shortcut: "n",
    action: () => createNewChange()
  })
})

// Palette searches all registered commands
<CommandPalette trigger="ctrl+p" />
```

**Benefits**:
- Searchable commands
- Self-documenting keybindings
- Powers help modal

---

## 6. Multi-Select Support

**Pattern from jjui**:

```typescript
interface SyncContextValue {
  // ... existing
  checkedItems: () => Set<string>     // Track multi-selected commits
  toggleChecked: (id: string) => void // Space to toggle
  clearChecked: () => void
}

// In LogPanel
<box backgroundColor={
  isSelected() ? theme.selection :
  isChecked() ? theme.selectionSecondary : 
  undefined
}>
```

**Use cases**: Batch abandon, batch squash, batch rebase.

---

## 7. Custom Commands

**Pattern from lazyjj**:

```toml
# In jj config
[lazierjj.commands]
fixup = "jj squash --into @-"
sync = "jj git fetch && jj rebase -d main@origin"
```

**With placeholder support** (from jjui):
```toml
[lazierjj.commands]
cherry-pick = "jj new $change_id"
diff-tool = "jj diff -r $change_id --tool difft"
```

---

## 8. Frame Pacing

**Pattern from jjui**:

Currently we render on every state change. For very fast navigation (holding j/k), this can cause CPU spikes.

```typescript
// Debounce renders to ~120 FPS (8ms)
let pendingRender = false
let lastRender = 0

function scheduleRender() {
  if (pendingRender) return
  const elapsed = Date.now() - lastRender
  if (elapsed >= 8) {
    render()
    lastRender = Date.now()
  } else {
    pendingRender = true
    setTimeout(() => {
      pendingRender = false
      render()
      lastRender = Date.now()
    }, 8 - elapsed)
  }
}
```

**Note**: OpenTUI may handle this internally. Profile before implementing.

---

## Priority Order

| Improvement | Effort | Impact | When |
|-------------|--------|--------|------|
| Theme tokens (Phase 1) | Low | High | **Now** |
| Test coverage | Low | Medium | **Now** |
| Theme context (Phase 2) | Medium | Medium | When users request themes |
| System theme (Phase 3) | Medium | Low | When users report clashes |
| Context split | Low | Medium | When adding bookmarks |
| Keyboard registry | Medium | High | When adding command palette |
| Command palette | High | High | Post-MVP |
| Multi-select | Medium | Medium | Post-MVP |
| Custom commands | Low | Medium | Post-MVP |
| Frame pacing | Low | Low | If performance issues |
