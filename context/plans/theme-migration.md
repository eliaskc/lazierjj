# Theme Migration Plan: Dual-Style Theme System

> **Status: ✅ COMPLETED** (2026-01-01)
> 
> Implementation deviated from original plan - simplified ThemeStyle to focus on key visual differences rather than full abstraction. See actual implementation in `src/theme/` and `src/context/theme.tsx`.

**Goal**: Migrate design-d styling to main, with a theme system powerful enough to switch between lazygit and opencode styles via a hardcoded toggle.

**Source workspaces**:
- `design-b` (lazygit style) - for ThemeProvider infrastructure
- `design-d` (opencode style) - for visual design

---

## Key Differences to Abstract

| Aspect | design-b (lazygit) | design-d (opencode) |
|--------|-------------------|---------------------|
| **Panel chrome** | `border` + `borderStyle="rounded"` + `title` | No border, internal title bar |
| **Focus indicator** | `borderColor` changes | `backgroundColor` changes |
| **Title format** | `[1] Log` in border | `1` + `Log` as separate elements |
| **Layout gaps** | 0 (dense) | `gap={1}`, `gap={2}` |
| **Outer padding** | 0 | `paddingTop={1}` etc on Layout |
| **Selection indicator** | None (bg only) | `▌ ` prefix |
| **Modal chrome** | Border with title | No border, internal header |

---

## Phase 1: Define Comprehensive Theme Type

```typescript
interface ThemeStyle {
  // Panel chrome
  panel: {
    useBorder: boolean
    borderStyle: "rounded" | "single" | "double"
    titleInBorder: boolean  // [1] Log in border vs internal
    focusIndicator: "border" | "background"
  }
  
  // Layout spacing
  layout: {
    panelGap: number      // gap between panels
    outerPadding: number  // padding around entire layout
  }
  
  // Selection
  selection: {
    showIndicator: boolean
    indicator: string     // "▌ " or ""
  }
  
  // Modal
  modal: {
    useBorder: boolean
    titleInBorder: boolean
  }
}

interface Theme {
  name: string
  colors: ThemeColors
  style: ThemeStyle
}
```

---

## Phase 2: Create Two Theme Presets

```typescript
const lazygitTheme: Theme = {
  name: "lazygit",
  colors: {
    primary: "#7FD962",
    borderFocused: "#7FD962",
    selectionBackground: "#323264",
    // ... rest from design-b
  },
  style: {
    panel: {
      useBorder: true,
      borderStyle: "rounded",
      titleInBorder: true,
      focusIndicator: "border",
    },
    layout: {
      panelGap: 0,
      outerPadding: 0,
    },
    selection: {
      showIndicator: false,
      indicator: "",
    },
    modal: {
      useBorder: true,
      titleInBorder: true,
    },
  },
}

const opencodeTheme: Theme = {
  name: "opencode",
  colors: {
    primary: "#fab283",
    borderFocused: "#fab283",
    selectionBackground: "#1e1e1e",
    // ... rest from design-d
  },
  style: {
    panel: {
      useBorder: false,
      borderStyle: "rounded",
      titleInBorder: false,
      focusIndicator: "background",
    },
    layout: {
      panelGap: 1,
      outerPadding: 1,
    },
    selection: {
      showIndicator: true,
      indicator: "▌ ",
    },
    modal: {
      useBorder: false,
      titleInBorder: false,
    },
  },
}
```

---

## Phase 3: Build Unified Panel Component

A single `<Panel>` that renders differently based on theme:

```typescript
function Panel(props: { title: string; hotkey: string; focused: boolean; children: JSX.Element }) {
  const { colors, style } = useTheme()
  
  // Border mode (lazygit)
  if (style().panel.useBorder) {
    const title = style().panel.titleInBorder 
      ? `[${props.hotkey}] ${props.title}` 
      : undefined
    return (
      <box
        border
        borderStyle={style().panel.borderStyle}
        borderColor={props.focused ? colors().borderFocused : colors().border}
        title={title}
        // ...
      >
        {props.children}
      </box>
    )
  }
  
  // No border mode (opencode)
  return (
    <box
      backgroundColor={props.focused ? colors().backgroundElement : colors().backgroundSecondary}
      padding={1}
    >
      <box marginBottom={1}>
        <text fg={colors().textMuted}>{props.hotkey}</text>
        <text fg={colors().text}><b>{props.title}</b></text>
      </box>
      {props.children}
    </box>
  )
}
```

---

## Phase 4: Build Unified Layout

```typescript
function Layout(props) {
  const { colors, style } = useTheme()
  
  return (
    <box
      backgroundColor={colors().background}
      gap={style().layout.panelGap}
      padding={style().layout.outerPadding}
      // ...
    >
      {/* panels */}
    </box>
  )
}
```

---

## Phase 5: Build Selection Row Component

```typescript
function SelectionRow(props: { selected: boolean; children: JSX.Element }) {
  const { colors, style } = useTheme()
  
  return (
    <box backgroundColor={props.selected ? colors().selectionBackground : undefined}>
      <Show when={style().selection.showIndicator}>
        <text fg={props.selected ? colors().primary : colors().background}>
          {props.selected ? style().selection.indicator : "  "}
        </text>
      </Show>
      {props.children}
    </box>
  )
}
```

---

## Phase 6: Hardcoded Toggle for Testing

In `src/context/theme.tsx`:

```typescript
// TOGGLE THIS TO SWITCH STYLES
const ACTIVE_THEME: "lazygit" | "opencode" = "opencode"

const themes = { lazygit: lazygitTheme, opencode: opencodeTheme }

// In provider init:
const [theme, setTheme] = createSignal(themes[ACTIVE_THEME])
```

---

## File Structure After Migration

```
src/
  theme/
    index.ts           # exports
    types.ts           # Theme, ThemeColors, ThemeStyle interfaces
    presets/
      lazygit.ts       # lazygit theme preset
      opencode.ts      # opencode theme preset
  context/
    theme.tsx          # ThemeProvider with hardcoded toggle
  components/
    Panel.tsx          # unified panel (theme-aware)
    SelectionRow.tsx   # unified selection row (theme-aware)  
    Layout.tsx         # unified layout (theme-aware)
    Modal.tsx          # unified modal wrapper (theme-aware)
```

---

## Implementation Order

1. **Create theme types** (`src/theme/types.ts`)
2. **Create presets** (`src/theme/presets/*.ts`)
3. **Port ThemeProvider** from design-b, add style accessor + hardcoded toggle
4. **Create Panel component** with conditional rendering
5. **Create SelectionRow component**
6. **Update Layout.tsx** to use theme spacing
7. **Refactor LogPanel** to use Panel + SelectionRow
8. **Refactor BookmarksPanel** to use Panel + SelectionRow
9. **Refactor MainArea** to use Panel
10. **Update HelpModal** with theme-aware modal wrapper
11. **Update StatusBar** to use colors()
12. **Test both themes** by flipping the toggle

---

## Verification Checklist

When flipping `ACTIVE_THEME` between `"lazygit"` and `"opencode"`:

- [x] Panel border style differs (rounded vs single)
- [x] Focus changes border color
- [x] Titles in border (`[1]─Log` format)
- [x] Layout outer padding differs (0 for lazygit, 1 for opencode)
- [x] Status bar separator differs (`•` vs gaps)
- [x] Dialog overlay opacity differs (0 vs 150)
- [x] Terminal background adaptation (lazygit only)
- [x] Scrollbar colors themed
- [x] Help modal uses theme border style
- [x] Colors are correct for each theme

**Not implemented** (simplified from original plan):
- Selection row indicator (`▌ `) - both themes use background-only selection
- Panel border vs no-border mode - both themes use borders, just different styles

---

## Color Palettes Reference

### lazygit (design-b)
```typescript
primary: "#7FD962"
background: "#0a0a0a"
backgroundSecondary: "#141414"
backgroundElement: "#1e1e1e"
text: "#eeeeee"
textMuted: "#808080"
border: "#606060"
borderFocused: "#7FD962"
selectionBackground: "#323264"
selectionText: "#eeeeee"
success: "#7FD962"
warning: "#e5c07b"
error: "#e06c75"
info: "#56b6c2"
```

### opencode (design-d)
```typescript
primary: "#fab283"
secondary: "#5c9cf5"
background: "#0a0a0a"
backgroundSecondary: "#141414"
backgroundElement: "#1e1e1e"
text: "#eeeeee"
textMuted: "#808080"
border: "#3c3c3c"
borderFocused: "#fab283"
selectionBackground: "#1e1e1e"
selectionText: "#fab283"
success: "#12c905"
warning: "#fcd53a"
error: "#fc533a"
info: "#5c9cf5"
purple: "#9d7cd8"
orange: "#f5a742"
greenCode: "#7fd88f"
```
