# Release & Distribution

**Status**: Implemented (v0.1.1)

---

## Overview

Kajji ships compiled binaries for all major platforms. No Bun required at runtime.

**Platforms:**
- darwin-arm64 (Apple Silicon)
- darwin-x64 (Intel Mac)
- linux-arm64
- linux-x64

---

## Installation Methods

```bash
# npm (recommended)
npm install -g kajji

# bun/pnpm/yarn
bun install -g kajji

# curl (standalone binary)
curl -fsSL https://raw.githubusercontent.com/eliaskc/kajji/main/install.sh | bash
```

---

## How It Works

### npm Distribution

1. **Wrapper package** (`kajji`) contains:
   - `bin/kajji` — Node.js wrapper script
   - `script/postinstall.mjs` — symlinks platform binary
   - `optionalDependencies` for all platform packages

2. **Platform packages** (`kajji-darwin-arm64`, etc.) contain:
   - Pre-compiled binary in `bin/kajji`
   - `os` and `cpu` fields for platform filtering

3. **On install**:
   - npm installs wrapper + matching platform package
   - postinstall creates symlink to binary
   - Wrapper detects platform and executes correct binary

### Curl Distribution

1. Script detects OS and architecture
2. Downloads archive from GitHub releases
3. Extracts binary to `~/.kajji/bin/`
4. Adds to PATH in shell config

---

## Publishing a Release

```bash
# 1. Bump version in package.json

# 2. Build all platforms
bun run script/build.ts

# 3. Publish to npm
bun run script/publish.ts

# 4. Create git tag
git tag v<version>
git push origin v<version>

# 5. Create GitHub release
gh release create v<version> dist/*.tar.gz dist/*.zip --title "v<version>"

# 6. Mark as latest (if prerelease)
gh release edit v<version> --prerelease=false
```

---

## Build Scripts

| Script | Purpose |
|--------|---------|
| `script/build.ts` | Compile binaries for all platforms |
| `script/publish.ts` | Package and publish to npm |
| `script/postinstall.mjs` | Symlink binary after npm install |
| `install.sh` | Curl install script |

---

## Future

- [ ] Homebrew tap
- [ ] GitHub Actions for automated releases
- [ ] Version indicator in UI
- [ ] Update notification

---

## Reference

- [OpenCode release patterns](../references/opencode-release-distribution.md)
