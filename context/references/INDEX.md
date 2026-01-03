# OpenCode Analysis - Complete Reference Index

## Overview

This folder contains a comprehensive analysis of OpenCode's release and distribution pipeline. OpenCode is a sophisticated Bun-based CLI tool that releases multiple times per day with automated builds for 10+ platform/architecture combinations.

## Documents

### 1. **opencode-release-distribution.md** (14 KB)
**Full technical analysis with code snippets**

Covers:
- Installation script (platform detection, CPU features, shell integration)
- Package.json structure (npm publishing strategy)
- Build process (multi-platform compilation, Bun.build configuration)
- GitHub Actions workflow (two-job pipeline)
- Publish orchestration script (version management, git tagging)
- NPM publishing strategy (platform-specific packages + wrapper)
- Postinstall script (platform detection, binary symlinking)
- Auto-update mechanism (installation method detection, upgrade logic)
- Release frequency and versioning
- Distribution channels (curl, npm, bun, brew, Docker, Tauri)
- Recommended implementation order for Lazyjuju

**Best for**: Deep understanding of how everything works together

### 2. **release-flows.md** (8 KB)
**Quick reference guide with key patterns**

Covers:
- 3-tier distribution model (curl, package managers, desktop app)
- Clever NPM strategy (11 packages instead of 1 massive one)
- Build matrix explanation (AVX2 detection, MUSL detection, baseline builds)
- Release orchestration script walkthrough
- Auto-update detection logic
- GitHub Actions workflow overview
- Version injection at build time
- Installation script highlights
- Release frequency statistics
- Phased implementation approach (6 phases)
- Gotchas and lessons learned

**Best for**: Quick lookup and understanding key concepts

### 3. **opencode-code-patterns.md** (1.7 KB)
**Index of copy-paste ready code patterns**

Lists 10 ready-to-use code patterns:
1. Installation method detection
2. Upgrade command
3. Multi-platform build script
4. NPM publish script
5. Postinstall script
6. Wrapper script
7. Release orchestration script
8. GitHub Actions workflow
9. Installation script
10. Version injection

**Best for**: Finding specific code to adapt

## Quick Start

### If you want to understand the big picture:
1. Read the "3-Tier Distribution Model" section in `release-flows.md`
2. Skim "The Clever NPM Strategy" section
3. Review "Recommended Phased Approach" for implementation order

### If you want to implement something specific:
1. Find the relevant section in `release-flows.md`
2. Look up the code pattern in `opencode-code-patterns.md`
3. Refer to `opencode-release-distribution.md` for detailed explanation

### If you want to understand a specific component:
1. Check the table of contents in `opencode-release-distribution.md`
2. Jump to the relevant section
3. Review code patterns if needed

## Key Concepts

### The 3-Tier Distribution Model
- **Tier 1**: Direct binary download via curl (no dependencies)
- **Tier 2**: Package managers (npm, bun, brew) with auto-updates
- **Tier 3**: Desktop app (Tauri) with built-in auto-update

### The Clever NPM Strategy
Instead of publishing one 500MB package, OpenCode publishes:
- 10 platform-specific packages (~50MB each)
- 1 wrapper package that depends on all of them as optional dependencies
- Postinstall script symlinks the right binary for the current platform

### Multi-Platform Build Matrix
Builds for:
- Linux (x64, arm64, x64-baseline, x64-musl, arm64-musl, x64-musl-baseline)
- macOS (x64, arm64, x64-baseline)
- Windows (x64, x64-baseline)

Detects:
- CPU features (AVX2) and provides baseline fallbacks
- libc type (glibc vs musl) for Linux
- Platform and architecture

### Smart Installation Method Detection
Detects how user installed the tool:
- Curl (checks path for `.opencode/bin` or `.local/bin`)
- npm (runs `npm list -g --depth=0`)
- bun (runs `bun pm ls -g`)
- pnpm (runs `pnpm list -g --depth=0`)
- brew (runs `brew list --formula opencode`)

Then upgrades via the same method, so users don't need to remember how they installed.

### Release Orchestration
One script (`publish-start.ts`) handles:
1. Generate changelog from git history
2. Update all package.json versions atomically
3. Build for all platforms
4. Publish to npm
5. Create git tag and GitHub release
6. Upload binaries to release

### Version Injection at Build Time
Version is injected via Bun.build `define`:
```typescript
define: {
  OPENCODE_VERSION: `'${Script.version}'`,
  OPENCODE_CHANNEL: `'${Script.channel}'`,
}
```

This bakes the version into the binary, enabling offline version checking.

## Implementation Roadmap for Lazyjuju

### Phase 1: Basic npm publishing
- Create `packages/lazyjuju` with bin entry
- Publish to npm as `lazyjuju`

### Phase 2: Multi-platform binaries
- Create `script/build.ts` for 3 platforms
- Publish platform-specific packages
- Create wrapper with postinstall

### Phase 3: Installation script
- Create `install` bash script
- Auto-detect platform/arch
- Auto-add to PATH

### Phase 4: Auto-update
- Implement `lazyjuju upgrade` command
- Detect installation method
- Support all package managers

### Phase 5: Release automation
- Create `script/publish-start.ts`
- Create GitHub Actions workflow
- Automate changelog generation

### Phase 6: Distribution channels
- Homebrew tap
- Docker image
- Desktop app (optional)

## Key Insights

1. **Baseline builds are essential** - Many users have older CPUs without AVX2
2. **MUSL detection matters** - Alpine Linux is common in containers
3. **Postinstall must be robust** - Fallback to Node.js if Bun not available
4. **Version must be injected at build time** - No runtime lookups
5. **Upgrade detection is critical** - Users forget how they installed
6. **GitHub Actions matrix is powerful** - Build 5 platforms in parallel
7. **Changelog generation saves time** - Automate from git history
8. **Optional dependencies are key** - npm doesn't fail if platform binary unavailable

## Reference Files in OpenCode Repo

- `install` - Installation script
- `packages/opencode/package.json` - Package structure
- `packages/opencode/script/build.ts` - Multi-platform build
- `packages/opencode/script/publish.ts` - NPM publishing
- `packages/opencode/script/postinstall.mjs` - Platform detection
- `packages/opencode/bin/opencode` - Wrapper script
- `packages/opencode/src/installation/index.ts` - Auto-update logic
- `.github/workflows/publish.yml` - Release workflow
- `script/publish-start.ts` - Release orchestration

## Release Statistics

- **Release frequency**: Multiple releases per day
- **Current version**: v1.0.223+ (as of Jan 2026)
- **Assets per release**: 32
  - 10 CLI binaries
  - 10 npm packages
  - 1 wrapper package
  - 5 Tauri installers
  - 5 Tauri updates
  - 1 Docker image

## Next Steps

1. **Understand the architecture**: Read `release-flows.md` sections 1-3
2. **Plan your implementation**: Review "Recommended Phased Approach"
3. **Start coding**: Use code patterns from `opencode-code-patterns.md`
4. **Reference details**: Check `opencode-release-distribution.md` as needed

All documents are in your project context for easy reference.
