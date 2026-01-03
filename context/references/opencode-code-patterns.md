# OpenCode Code Patterns - Copy-Paste Ready

This document contains ready-to-use code patterns from OpenCode that you can adapt for Lazyjuju.

See the full document at: https://github.com/anomalyco/opencode

## Key Patterns Covered

1. **Installation Method Detection** - Detect how user installed the tool
2. **Upgrade Command** - Smart upgrade that uses the same installation method
3. **Multi-Platform Build Script** - Build for 10+ platform/arch combinations
4. **NPM Publishing** - Publish platform-specific packages
5. **Postinstall Script** - Platform detection and binary symlinking
6. **Wrapper Script** - Node.js wrapper that finds and executes the right binary
7. **Release Orchestration** - Single script that handles versioning, tagging, publishing
8. **GitHub Actions Workflow** - Automated release pipeline
9. **Installation Script** - Bash script for direct binary download
10. **Version Injection** - Bake version into binary at build time

## Quick Links

- **Installation Method Detection**: Detects curl, npm, bun, pnpm, brew
- **Upgrade Logic**: Upgrades via the same method user installed with
- **Build Matrix**: Handles AVX2 detection, MUSL detection, baseline builds
- **NPM Strategy**: Publishes 11 packages (10 platform-specific + 1 wrapper)
- **Postinstall**: Symlinks platform-specific binary to wrapper
- **Version Injection**: Uses Bun.build `define` to inject version at compile time

## Implementation Order

1. Start with installation method detection
2. Add upgrade command
3. Create build script for your platform
4. Add NPM publishing
5. Create postinstall script
6. Build wrapper script
7. Create release orchestration
8. Setup GitHub Actions
9. Create installation script
10. Add version injection

See the full code patterns in the referenced files.
