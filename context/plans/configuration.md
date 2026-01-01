# Configuration System

**Status**: Not started  
**Priority**: High

---

## Current State

No user configuration. Theme is hardcoded toggle, keybindings are hardcoded.

## Goals

Design a configuration system inspired by [jjui's approach](https://github.com/idursun/jjui/wiki/Configuration):

- **Location**: `~/.config/lazyjuju/config.toml` (respects XDG_CONFIG_HOME)
- **Alternative**: Could also read from `[lazyjuju]` section in jj's config

## Proposed Structure

```toml
# ~/.config/lazyjuju/config.toml

[ui]
theme = "lazygit"  # or "opencode", custom theme name

[ui.colors]
# Override specific colors
# selected = { bg = "#3a3a3a" }

[diff]
# Diff display preferences
tool = "difft"           # Override jj's diff tool
default_mode = "side-by-side"  # or "unified"
auto_switch_width = 120  # Switch to unified below this width

[keybinds]
# Global keybinds
quit = "q"
help = "?"
refresh = "R"

[keybinds.log]
# Context-specific keybinds for log panel
# ...

[revisions]
# Override jj's default revset and template
# revset = "..."
# template = "builtin_log_compact"
```

## Reference

- jjui config wiki: https://github.com/idursun/jjui/wiki/Configuration
- jjui default config: https://github.com/idursun/jjui/blob/main/internal/config/default/config.toml

## Tasks

- [ ] Design full configuration schema
- [ ] Implement TOML parser/loader
- [ ] Add config file watcher for live reload (nice-to-have)
- [ ] Document all config options
