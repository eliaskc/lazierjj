# Configuration System

**Status**: Not started  
**Priority**: Medium

---

## Location

- **Config**: `~/.config/kajji/config.toml`
- **State**: `~/.config/kajji/state.json` (runtime state, not user-editable)
- Respects `XDG_CONFIG_HOME` if set

---

## Open Config Command

- Keybind: TBD (or unbound — accessible via help modal only)
- Visibility: `help-only` (not shown in status bar)
- Behavior:
  1. If config file doesn't exist, create with defaults/comments
  2. Open in `$EDITOR` (fallback to `vim`, `nano`, `vi`)
  3. On save, reload config (if file watcher implemented)

---

## Proposed Structure

```toml
# ~/.config/kajji/config.toml

[ui]
theme = "lazygit"  # or "opencode"

[ui.colors]
# Override specific colors (optional)
# primary = "#4ECDC4"

[diff]
tool = "difft"              # Override jj's diff tool
default_mode = "unified"    # or "side-by-side"
auto_switch_width = 120     # Switch to unified below this width

[keybinds]
# Custom keybinds (optional)
# quit = "ctrl+q"

[keybinds.log]
# Context-specific overrides
```

---

## State File

```json
{
  "lastUpdateCheck": "2026-01-03T12:00:00Z",
  "dismissedVersion": null,
  "windowSize": { "width": 120, "height": 40 }
}
```

Not user-editable, managed by kajji.

---

## Tasks

- [ ] Create config directory on first run
- [ ] Implement TOML parser/loader
- [ ] Add "open config" command (help-only visibility)
- [ ] Create default config template with comments
- [ ] Open in $EDITOR with fallbacks
- [ ] Add config file watcher for live reload (nice-to-have)
- [ ] Document all config options

---

## Reference

- jjui config: https://github.com/idursun/jjui/wiki/Configuration
