# Release & Distribution

**Status**: Planning complete  
**Priority**: High (next up)

---

## Overview

Phased approach starting simple (npm with Bun requirement), adding complexity only when needed.

**Key decisions:**
- Require Bun for initial release (simplifies everything)
- Semantic versioning starting at `0.1.0`
- Config/state in `~/.config/kajji/` (respects XDG_CONFIG_HOME)
- Update notification via toast, not blocking

---

## Phase 1: npm Publish (Initial Release)

Ship source code, require Bun runtime.

### package.json Changes

```json
{
  "name": "kajji",
  "version": "0.1.0",
  "private": false,
  "bin": {
    "kajji": "./bin/kajji.js"
  },
  "files": ["bin", "src"],
  // ... rest unchanged
}
```

### New File: `bin/kajji.js`

```javascript
#!/usr/bin/env bun
import "../src/index.tsx"
```

### Tasks

- [ ] Create `bin/kajji.js` entry script
- [ ] Update package.json (remove private, add bin/files/version)
- [ ] Test locally with `npm link`
- [ ] Test with `bunx kajji` from different directory
- [ ] Publish to npm

### Installation Methods (all work after npm publish)

```bash
# Global install
npm install -g kajji
bun install -g kajji
pnpm add -g kajji
yarn global add kajji

# One-off run
bunx kajji
npx kajji
pnpm dlx kajji
yarn dlx kajji
```

**Note:** All methods require [Bun](https://bun.sh) installed.

---

## Phase 2: Version Indicator + Update Notification

### Version Indicator

- Location: StatusBar, bottom-right corner (using `justifyContent="space-between"`)
- Style: Muted color (`colors().textMuted`)
- Format: `v0.1.0`
- Always visible

### Update Check

**Behavior:**
- Check GitHub releases API on startup (non-blocking, background)
- Frequency: Once per 24 hours
- Store last check timestamp in `~/.config/kajji/state.json`
- If new version available, show toast (OpenTUI toast component)

**State file:** `~/.config/kajji/state.json`
```json
{
  "lastUpdateCheck": "2026-01-03T12:00:00Z",
  "dismissedVersion": null
}
```

### Package Manager Detection

Detect how user installed to show correct update command:

```typescript
async function detectPackageManager(): Promise<"bun" | "npm" | "yarn" | "pnpm" | "unknown"> {
  // Check environment variables set by package managers
  const execPath = process.env.npm_execpath ?? ""
  
  if (execPath.includes("bun")) return "bun"
  if (execPath.includes("yarn")) return "yarn"
  if (execPath.includes("pnpm")) return "pnpm"
  if (execPath.includes("npm")) return "npm"
  
  // Fallback: check global install locations
  const bunGlobal = path.join(process.env.HOME ?? "", ".bun/install/global/node_modules/kajji")
  if (await exists(bunGlobal)) return "bun"
  
  // Default to npm (most common)
  return "npm"
}
```

**Update commands by package manager:**
| Manager | Command                        |
| ------- | ------------------------------ |
| bun     | `bun update -g kajji`       |
| npm     | `npm update -g kajji`       |
| yarn    | `yarn global upgrade kajji` |
| pnpm    | `pnpm update -g kajji`      |

### Toast Message

```
Update available: v0.2.0
Run: npm update -g kajji
```

### Tasks

- [ ] Add version constant (read from package.json or inject at build)
- [ ] Add version indicator to StatusBar (right-aligned, muted)
- [ ] Create `~/.config/kajji/` directory structure
- [ ] Implement update check (GitHub releases API)
- [ ] Implement package manager detection
- [ ] Show toast when update available
- [ ] Respect XDG_CONFIG_HOME

---

## Phase 3: Compiled Binaries + Curl (Deferred)

**Trigger:** User demand, or when Bun requirement becomes a blocker.

Would include:
- `bun build --compile` for standalone binaries
- Platform-specific npm packages (kajji-darwin-arm64, etc.)
- GitHub Actions matrix builds
- curl install script
- Auto-update command (`kajji update`)

See `context/references/opencode-release-distribution.md` for implementation patterns.

---

## Future: Homebrew

```bash
brew tap USERNAME/kajji
brew install kajji
```

Requires:
- Compiled binaries (Phase 3)
- Separate `homebrew-kajji` repo with formula
- CI to update formula on release

---

## Reference

- [OpenCode release patterns](../references/opencode-release-distribution.md)
- [OpenCode code patterns](../references/opencode-code-patterns.md)
