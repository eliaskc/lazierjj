# Configuration System

**Status:** Not started (config file exists but only has minimal fields).

---

## Locations (current code)

- **Config:** `~/.config/kajji/config.json`
- **State:** `~/.local/state/kajji/state.json`

Config is user-editable. State is runtime-managed.

---

## Current Config Shape

```
{
  "whatsNewDisabled": false
}
```

---

## Target Structure (proposed)

```
{
  "ui": {
    "theme": "lazygit"
  },
  "diff": {
    "defaultMode": "unified",
    "autoSwitchWidth": 120
  },
  "keybinds": {
    "quit": "ctrl+q"
  },
  "whatsNewDisabled": false
}
```

---

## Open Config Command

- Visibility: help-only
- Behavior:
  - Create config if missing
  - Open `$EDITOR` (fallback to `vim`, `nano`, `vi`)
  - Reload on save (optional watcher)

---

## Tasks

- Implement config loader with schema and defaults.
- Add "open config" command.
- Document config options in README or `PROJECT.md`.

---

## References

- `src/utils/state.ts` (current state/config storage)
