# Build & Release Flows

**Status**: Not started  
**Priority**: Medium

---

## Goals

Enable users to install lazyjuju easily via:

1. **bunx** — Zero-install execution
2. **Homebrew** — macOS/Linux package manager
3. **npm/pnpm/yarn** — Node ecosystem

## Homebrew

Create a Homebrew tap:

```bash
brew tap YOUR_USERNAME/lazyjuju
brew install lazyjuju
```

Requirements:
- Create `homebrew-lazyjuju` repo with formula
- Binary releases on GitHub
- Formula that downloads and installs binary

## bunx / npx

Publish to npm:

```bash
bunx lazyjuju
# or
npx lazyjuju
```

Requirements:
- Add `"bin"` to package.json:
  ```json
  "bin": {
    "lazyjuju": "./bin/lazyjuju.js",
    "ljj": "./bin/lazyjuju.js"
  }
  ```
- Create entry script that works with Bun

## GitHub Releases

Automated releases with:
- Semantic versioning (or date-based: `2026.01.15`)
- Changelog generation (git-cliff or similar)
- Binary builds for macOS/Linux (arm64, x64)

## CI/CD

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ["v*"]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      # Build binaries
      # Create GitHub release
      # Publish to npm
      # Update Homebrew formula
```

## Tasks

- [ ] Set up npm package structure
- [ ] Create bin entry script
- [ ] Create GitHub Actions workflow for releases
- [ ] Set up Homebrew tap repository
- [ ] Add changelog generation
- [ ] Test cross-platform builds
