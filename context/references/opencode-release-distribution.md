# OpenCode Release & Distribution Flow Analysis

## Overview
OpenCode (anomalyco/opencode) is a sophisticated Bun-based CLI tool with a multi-platform release strategy. They release frequently (multiple times per day) with automated builds for 10+ platform/architecture combinations.

---

## 1. INSTALLATION SCRIPT

**Location**: `install` (served via https://opencode.ai/install)

### Key Features:
- **Platform Detection**: Automatically detects OS (darwin/linux/windows) and architecture (x64/arm64)
- **CPU Feature Detection**: Checks for AVX2 support; falls back to baseline builds if unavailable
- **MUSL Detection**: Detects Alpine/musl-based Linux systems
- **Progress Tracking**: Custom progress bar with curl trace parsing
- **Shell Integration**: Auto-adds to PATH in .zshrc, .bashrc, .bashenv, fish config, etc.
- **Version Checking**: Fetches latest release from GitHub API before downloading
- **Fallback Handling**: Graceful degradation for non-TTY environments

### Installation Targets:
```
- linux-x64, linux-arm64
- linux-x64-baseline (no AVX2)
- linux-x64-musl, linux-arm64-musl (Alpine)
- darwin-x64, darwin-arm64
- darwin-x64-baseline
- windows-x64, windows-x64-baseline
```

### Download Strategy:
- **Latest**: `https://github.com/anomalyco/opencode/releases/latest/download/{filename}`
- **Specific**: `https://github.com/anomalyco/opencode/releases/download/v{version}/{filename}`
- **Archive Format**: `.tar.gz` for Linux, `.zip` for macOS/Windows

---

## 2. PACKAGE.JSON STRUCTURE

**Location**: `packages/opencode/package.json`

### Key Configuration:
```json
{
  "name": "opencode",
  "version": "1.0.224",
  "type": "module",
  "packageManager": "bun@1.3.5",
  "bin": {
    "opencode": "./bin/opencode"
  },
  "scripts": {
    "build": "bun run script/build.ts",
    "dev": "bun run --conditions=browser ./src/index.ts"
  }
}
```

### Publishing Strategy:
- **NPM Package**: `opencode-ai` (wrapper with optional platform-specific binaries)
- **Platform Packages**: `opencode-{os}-{arch}` (e.g., `opencode-linux-x64`)
- **Postinstall Hook**: Symlinks platform-specific binary to wrapper
- **Tags**: Published with channel tags (e.g., `latest`, `snapshot`)

---

## 3. BUILD PROCESS

**Script**: `packages/opencode/script/build.ts`

### Multi-Platform Compilation:
```typescript
// Targets all combinations:
const allTargets = [
  { os: "linux", arch: "arm64" },
  { os: "linux", arch: "x64" },
  { os: "linux", arch: "x64", avx2: false },  // baseline
  { os: "linux", arch: "arm64", abi: "musl" },
  { os: "darwin", arch: "arm64" },
  { os: "darwin", arch: "x64" },
  { os: "win32", arch: "x64" },
  // ... more combinations
]
```

### Build Steps:
1. **Install platform-specific dependencies**:
   ```bash
   bun install --os="*" --cpu="*" @opentui/core
   bun install --os="*" --cpu="*" @parcel/watcher
   ```

2. **Compile with Bun**:
   ```typescript
   await Bun.build({
     conditions: ["browser"],
     compile: {
       target: "bun-{os}-{arch}",
       outfile: `dist/${name}/bin/opencode`,
     },
     define: {
       OPENCODE_VERSION: version,
       OPENCODE_CHANNEL: channel,
       OPENCODE_WORKER_PATH: workerPath,
     },
   })
   ```

3. **Create archives**:
   - Linux: `tar -czf opencode-linux-x64.tar.gz`
   - macOS/Windows: `zip -r opencode-darwin-arm64.zip`

4. **Publish to npm**:
   ```bash
   bun pm pack
   npm publish *.tgz --access public --tag latest
   ```

---

## 4. GITHUB ACTIONS RELEASE WORKFLOW

**File**: `.github/workflows/publish.yml`

### Trigger Events:
- **Auto**: Push to `dev` or `snapshot-*` branches
- **Manual**: Workflow dispatch with options:
  - `bump`: major/minor/patch
  - `version`: Override version (optional)

### Jobs:

#### Job 1: `publish` (Main Release)
**Runner**: `blacksmith-4vcpu-ubuntu-2404`

**Steps**:
1. Checkout with full history
2. Setup Bun
3. Install OpenCode (for scripting)
4. Login to GitHub Container Registry
5. Setup Docker Buildx + QEMU
6. Setup Node.js
7. Configure Git identity
8. **Run `./script/publish-start.ts`** (orchestrates everything)

**Outputs**:
- `release`: GitHub release ID
- `tag`: Git tag (e.g., v1.0.223)
- `version`: Version number

#### Job 2: `publish-tauri` (Desktop App)
**Runs after**: `publish` job completes
**Strategy**: Matrix build for 5 platforms:
- macOS x86_64 (Intel)
- macOS arm64 (Apple Silicon)
- Windows x64
- Linux x86_64
- Linux arm64

**Steps**:
1. Checkout at release tag
2. Import Apple code signing certificates (macOS)
3. Setup Rust toolchain
4. Install system dependencies (Linux)
5. Run `./packages/desktop/scripts/prepare.ts`
6. Build with Tauri
7. Upload artifacts to release

---

## 5. PUBLISH ORCHESTRATION SCRIPT

**File**: `script/publish-start.ts`

### Workflow:
```typescript
// 1. Get changelog from previous release to HEAD
const notes = await buildNotes(previous, "HEAD")

// 2. Update all package.json versions
for (const file of pkgjsons) {
  pkg = pkg.replaceAll(/"version": "[^"]+"/g, `"version": "${Script.version}"`)
}

// 3. Update extension manifests (Zed, etc.)
toml = toml.replace(/^version = "[^"]+"/m, `version = "${Script.version}"`)

// 4. Run package-specific publish scripts
await import(`../packages/opencode/script/publish.ts`)
await import(`../packages/sdk/js/script/publish.ts`)
await import(`../packages/plugin/script/publish.ts`)

// 5. Create git commit and tag
await $`git commit -am "release: v${Script.version}"`
await $`git tag v${Script.version}`

// 6. Push and create GitHub release
await $`git push origin HEAD --tags --no-verify --force-with-lease`
await $`gh release create v${Script.version} -d --notes ${notes} ./packages/opencode/dist/*.zip ./packages/opencode/dist/*.tar.gz`

// 7. Output release metadata
output += `release=${release.id}\n`
output += `tag=${release.tagName}\n`
```

---

## 6. NPM PUBLISHING STRATEGY

**File**: `packages/opencode/script/publish.ts`

### Two-Package Approach:

#### Package 1: Platform-Specific Binaries
```json
{
  "name": "opencode-linux-x64",
  "version": "1.0.224",
  "os": ["linux"],
  "cpu": ["x64"],
  "bin": { "opencode": "./bin/opencode" }
}
```
- Published to npm registry
- One package per platform/arch combination
- Contains pre-compiled binary

#### Package 2: Wrapper Package
```json
{
  "name": "opencode-ai",
  "version": "1.0.224",
  "bin": { "opencode": "./bin/opencode" },
  "optionalDependencies": {
    "opencode-linux-x64": "1.0.224",
    "opencode-darwin-arm64": "1.0.224",
    // ... all platform variants
  },
  "scripts": {
    "postinstall": "bun ./postinstall.mjs || node ./postinstall.mjs"
  }
}
```
- Depends on platform-specific packages as optional dependencies
- Postinstall script symlinks correct binary for current platform
- Graceful fallback if platform binary unavailable

### Publishing Command:
```bash
# For each platform binary
npm publish *.tgz --access public --tag latest

# For wrapper package
npm publish *.tgz --access public --tag latest
```

---

## 7. POSTINSTALL SCRIPT

**File**: `packages/opencode/script/postinstall.mjs`

### Functionality:
```javascript
// 1. Detect platform and architecture
const { platform, arch } = detectPlatformAndArch()

// 2. Find platform-specific package
const packageName = `opencode-${platform}-${arch}`
const packageJsonPath = require.resolve(`${packageName}/package.json`)
const binaryPath = path.join(packageDir, "bin", binaryName)

// 3. Create symlink (Unix) or copy (Windows)
fs.symlinkSync(sourcePath, targetPath)
```

### Wrapper Script
**File**: `packages/opencode/bin/opencode`

```javascript
// 1. Check OPENCODE_BIN_PATH env var
if (process.env.OPENCODE_BIN_PATH) {
  run(process.env.OPENCODE_BIN_PATH)
}

// 2. Detect platform/arch
const base = "opencode-" + platform + "-" + arch

// 3. Find binary in node_modules
const packageJsonPath = require.resolve(`${base}/package.json`)
const binaryPath = path.join(packageDir, "bin", binaryName)

// 4. Execute with stdio inheritance
childProcess.spawnSync(binaryPath, process.argv.slice(2), {
  stdio: "inherit"
})
```

---

## 8. AUTO-UPDATE MECHANISM

**File**: `packages/opencode/src/installation/index.ts`

### Update Command:
```bash
opencode upgrade [target] [--method curl|npm|pnpm|bun|brew]
```

### Implementation:
```typescript
export async function upgrade(method: Method, target: string) {
  let cmd
  switch (method) {
    case "curl":
      cmd = $`curl -fsSL https://opencode.ai/install | bash`.env({
        VERSION: target,
      })
      break
    case "npm":
      cmd = $`npm install -g opencode-ai@${target}`
      break
    case "pnpm":
      cmd = $`pnpm install -g opencode-ai@${target}`
      break
    case "bun":
      cmd = $`bun install -g opencode-ai@${target}`
      break
    case "brew":
      const formula = await getBrewFormula()
      cmd = $`brew install ${formula}`
      break
  }
  const result = await cmd.quiet().throws(false)
  if (result.exitCode !== 0) {
    throw new UpgradeFailedError({ stderr: result.stderr.toString() })
  }
}
```

### Version Detection:
```typescript
export async function latest(installMethod?: Method) {
  const detectedMethod = installMethod || (await method())

  if (detectedMethod === "brew") {
    return fetch("https://formulae.brew.sh/api/formula/opencode.json")
      .then(res => res.json())
      .then(data => data.versions.stable)
  }

  if (detectedMethod === "npm" || detectedMethod === "bun" || detectedMethod === "pnpm") {
    const registry = await $`npm config get registry`.quiet().text()
    return fetch(`${registry}/opencode-ai/${CHANNEL}`)
      .then(res => res.json())
      .then(data => data.version)
  }

  // Fallback to GitHub API
  return fetch("https://api.github.com/repos/anomalyco/opencode/releases/latest")
    .then(res => res.json())
    .then(data => data.tag_name.replace(/^v/, ""))
}
```

### Installation Method Detection:
```typescript
export async function method() {
  // Check if installed via curl
  if (process.execPath.includes(".opencode/bin")) return "curl"
  if (process.execPath.includes(".local/bin")) return "curl"

  // Check package managers
  const checks = [
    { name: "npm", command: () => $`npm list -g --depth=0` },
    { name: "yarn", command: () => $`yarn global list` },
    { name: "pnpm", command: () => $`pnpm list -g --depth=0` },
    { name: "bun", command: () => $`bun pm ls -g` },
    { name: "brew", command: () => $`brew list --formula opencode` },
  ]

  for (const check of checks) {
    const output = await check.command()
    if (output.includes("opencode")) return check.name
  }

  return "unknown"
}
```

---

## 9. RELEASE FREQUENCY & VERSIONING

### Current Release Cadence:
- **Multiple releases per day** (v1.0.219 → v1.0.223 in 24 hours)
- **Semantic versioning**: v{major}.{minor}.{patch}
- **Channel support**: `latest`, `snapshot`, `local`

### Release Assets (per release):
- **32 assets** per release:
  - 10 CLI binaries (5 platforms × 2 variants: normal + baseline)
  - 10 npm packages (platform-specific)
  - 1 wrapper npm package
  - 5 Tauri desktop app installers
  - 5 Tauri app updates
  - Docker image

---

## 10. DISTRIBUTION CHANNELS

### 1. **Direct Download** (GitHub Releases)
```bash
curl -fsSL https://opencode.ai/install | bash
curl -fsSL https://opencode.ai/install | bash -s -- --version 1.0.220
```

### 2. **NPM Registry**
```bash
npm install -g opencode-ai
npm install -g opencode-ai@latest
npm install -g opencode-ai@snapshot
```

### 3. **Bun Package Manager**
```bash
bun install -g opencode-ai
```

### 4. **Homebrew** (via tap)
```bash
brew install sst/tap/opencode
# or
brew install opencode
```

### 5. **Desktop App** (Tauri)
- macOS: `.dmg` installer
- Windows: `.msi` installer
- Linux: `.AppImage` or `.deb`

### 6. **Docker**
```bash
docker pull ghcr.io/anomalyco/opencode:latest
docker run ghcr.io/anomalyco/opencode:1.0.223
```

---

## KEY PATTERNS FOR LAZYJUJU

### 1. **Multi-Platform Binary Strategy**
✅ Build for all major platforms in CI
✅ Detect CPU features (AVX2) and provide baseline fallbacks
✅ Detect libc (glibc vs musl) for Linux

### 2. **Installation Script**
✅ Serve via short URL (opencode.ai/install)
✅ Auto-detect platform/arch
✅ Auto-add to PATH in shell configs
✅ Support version pinning

### 3. **NPM Publishing**
✅ Publish platform-specific binaries as separate packages
✅ Wrapper package with optional dependencies
✅ Postinstall script for platform detection
✅ Support multiple channels (latest, snapshot)

### 4. **Auto-Update**
✅ Detect installation method (curl, npm, bun, brew)
✅ Upgrade via same method
✅ Check latest version from appropriate registry
✅ Fallback to GitHub API

### 5. **Release Automation**
✅ Single orchestration script (publish-start.ts)
✅ Update all version strings atomically
✅ Create git tag and GitHub release
✅ Publish to multiple registries in parallel
✅ Build desktop apps in matrix strategy

### 6. **Versioning**
✅ Semantic versioning (major.minor.patch)
✅ Channel support (latest, snapshot, local)
✅ Version injected at build time via define
✅ Changelog generation from git history

---

## RECOMMENDED IMPLEMENTATION ORDER FOR LAZYJUJU

1. **Phase 1**: Basic npm publishing
   - Create `packages/lazyjuju` with bin entry
   - Publish to npm as `lazyjuju`

2. **Phase 2**: Multi-platform binaries
   - Add build.ts for all platforms
   - Publish platform-specific packages
   - Create wrapper with postinstall

3. **Phase 3**: Installation script
   - Create install script (bash)
   - Serve via short URL
   - Auto-detect platform/arch

4. **Phase 4**: Auto-update
   - Implement `upgrade` command
   - Detect installation method
   - Support all package managers

5. **Phase 5**: Release automation
   - Create publish-start.ts
   - GitHub Actions workflow
   - Changelog generation

6. **Phase 6**: Distribution channels
   - Homebrew tap
   - Docker image
   - Desktop app (optional)

