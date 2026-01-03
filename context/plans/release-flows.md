# OpenCode Release Flow - Quick Reference for Lazyjuju

## The 3-Tier Distribution Model

OpenCode uses a sophisticated **3-tier approach** that's worth copying:

### Tier 1: Direct Binary Download (Curl)
```bash
curl -fsSL https://opencode.ai/install | bash
```
- **Pros**: No dependencies, works everywhere, fast
- **Cons**: Manual updates, no package manager integration
- **Implementation**: Single bash script that detects platform/arch

### Tier 2: Package Managers (npm, bun, brew)
```bash
npm install -g opencode-ai
bun install -g opencode-ai
brew install opencode
```
- **Pros**: Integrated with existing workflows, auto-updates
- **Cons**: Requires package manager, slower
- **Implementation**: Wrapper package with platform-specific optional dependencies

### Tier 3: Desktop App (Tauri)
- macOS, Windows, Linux installers
- Auto-update built-in
- GUI optional

---

## The Clever NPM Strategy

Instead of publishing one massive package, OpenCode publishes **11 packages**:

```
opencode-linux-x64       ← Platform-specific (contains binary)
opencode-linux-arm64     ← Platform-specific
opencode-darwin-x64      ← Platform-specific
opencode-darwin-arm64    ← Platform-specific
opencode-windows-x64     ← Platform-specific
... (6 more variants)
opencode-ai              ← Wrapper (depends on all above as optional)
```

**Why this works**:
1. Each platform package is small (~50MB vs 500MB if bundled)
2. npm only downloads the one you need
3. Postinstall script symlinks the right binary
4. Graceful fallback if binary unavailable

**For Lazyjuju**: Start with just 2-3 key platforms (darwin-arm64, linux-x64, windows-x64)

---

## Build Matrix (What Gets Built)

```typescript
const targets = [
  // Linux
  { os: "linux", arch: "x64" },
  { os: "linux", arch: "x64", avx2: false },  // Baseline for old CPUs
  { os: "linux", arch: "arm64" },
  { os: "linux", arch: "arm64", abi: "musl" }, // Alpine Linux
  
  // macOS
  { os: "darwin", arch: "x64" },
  { os: "darwin", arch: "x64", avx2: false },
  { os: "darwin", arch: "arm64" },
  
  // Windows
  { os: "win32", arch: "x64" },
  { os: "win32", arch: "x64", avx2: false },
]
```

**Key insight**: They build **baseline variants** for older CPUs without AVX2. This is why their install script checks CPU features.

---

## The Release Orchestration Script

One script (`publish-start.ts`) handles everything:

```typescript
// 1. Get changelog
const notes = await buildNotes(previous, "HEAD")

// 2. Update ALL versions atomically
for (const file of pkgjsons) {
  pkg = pkg.replaceAll(/"version": "[^"]+"/g, `"version": "${Script.version}"`)
}

// 3. Build and publish
await import(`../packages/opencode/script/publish.ts`)

// 4. Create git tag
await $`git tag v${Script.version}`

// 5. Create GitHub release with binaries
await $`gh release create v${Script.version} --notes ${notes} ./dist/*.zip ./dist/*.tar.gz`
```

**Why this matters**: Single source of truth for versioning. No manual version bumping.

---

## Auto-Update Detection

OpenCode's `upgrade` command is smart:

```typescript
export async function method() {
  // Check installation path
  if (process.execPath.includes(".opencode/bin")) return "curl"
  
  // Check package managers
  const checks = [
    { name: "npm", command: () => $`npm list -g --depth=0` },
    { name: "bun", command: () => $`bun pm ls -g` },
    { name: "brew", command: () => $`brew list --formula opencode` },
  ]
  
  for (const check of checks) {
    if ((await check.command()).includes("opencode")) return check.name
  }
  
  return "unknown"
}
```

Then upgrades via the same method:
```typescript
switch (method) {
  case "curl":
    await $`curl -fsSL https://opencode.ai/install | bash`.env({ VERSION: target })
  case "npm":
    await $`npm install -g opencode-ai@${target}`
  case "bun":
    await $`bun install -g opencode-ai@${target}`
  case "brew":
    await $`brew install ${formula}`
}
```

**For Lazyjuju**: This is the key to seamless updates. Users don't need to remember how they installed it.

---

## GitHub Actions Workflow

Two jobs:

**Job 1: `publish`** (Linux runner)
- Runs `./script/publish-start.ts`
- Outputs: release ID, tag, version
- Takes ~10 minutes

**Job 2: `publish-tauri`** (Matrix: 5 platforms)
- Waits for Job 1
- Builds desktop app for each platform in parallel
- Uploads to release created by Job 1
- Takes ~30 minutes total

**Trigger**: Push to `dev` branch OR manual workflow dispatch

---

## Version Injection at Build Time

```typescript
await Bun.build({
  define: {
    OPENCODE_VERSION: `'${Script.version}'`,
    OPENCODE_CHANNEL: `'${Script.channel}'`,
    OPENCODE_WORKER_PATH: workerPath,
  },
})
```

Then in code:
```typescript
declare global {
  const OPENCODE_VERSION: string
  const OPENCODE_CHANNEL: string
}

export const VERSION = OPENCODE_VERSION  // "1.0.224"
export const CHANNEL = OPENCODE_CHANNEL  // "latest"
```

**Why**: No runtime version lookup, version is baked into binary.

---

## Installation Script Highlights

The `install` script is ~400 lines of bash that:

1. **Detects platform/arch**
   ```bash
   os=$(uname -s | tr '[:upper:]' '[:lower:]')
   arch=$(uname -m)
   ```

2. **Checks CPU features**
   ```bash
   if ! grep -qi avx2 /proc/cpuinfo; then
     needs_baseline=true
   fi
   ```

3. **Detects libc**
   ```bash
   if [ -f /etc/alpine-release ]; then
     is_musl=true
   fi
   ```

4. **Downloads with progress**
   ```bash
   download_with_progress "$url" "$tmp_dir/$filename"
   ```

5. **Auto-adds to PATH**
   ```bash
   add_to_path "$HOME/.zshrc" "export PATH=$INSTALL_DIR:\$PATH"
   ```

6. **Handles GitHub Actions**
   ```bash
   if [ -n "${GITHUB_ACTIONS-}" ]; then
     echo "$INSTALL_DIR" >> $GITHUB_PATH
   fi
   ```

---

## Release Frequency

- **Multiple releases per day** (v1.0.219 → v1.0.223 in 24 hours)
- **32 assets per release**:
  - 10 CLI binaries
  - 10 npm packages
  - 1 wrapper package
  - 5 Tauri installers
  - 5 Tauri updates
  - 1 Docker image

---

## Recommended Phased Approach for Lazyjuju

### Phase 1 (Week 1): Basic npm publishing
- [ ] Create `packages/lazyjuju` with bin entry
- [ ] Publish to npm as `lazyjuju`
- [ ] Test: `npm install -g lazyjuju`

### Phase 2 (Week 2): Multi-platform binaries
- [ ] Create `script/build.ts` for 3 platforms (darwin-arm64, linux-x64, windows-x64)
- [ ] Publish platform-specific packages
- [ ] Create wrapper with postinstall
- [ ] Test: `npm install -g lazyjuju` on each platform

### Phase 3 (Week 3): Installation script
- [ ] Create `install` bash script
- [ ] Test platform detection
- [ ] Test PATH modification
- [ ] Serve via GitHub Pages or short URL

### Phase 4 (Week 4): Auto-update
- [ ] Implement `lazyjuju upgrade` command
- [ ] Detect installation method
- [ ] Test upgrade from each method

### Phase 5 (Week 5): Release automation
- [ ] Create `script/publish-start.ts`
- [ ] Create GitHub Actions workflow
- [ ] Test full release cycle

### Phase 6 (Week 6+): Distribution channels
- [ ] Homebrew tap
- [ ] Docker image
- [ ] Desktop app (optional)

---

## Key Files to Reference

In OpenCode repo:
- `install` - Installation script
- `packages/opencode/package.json` - Package structure
- `packages/opencode/script/build.ts` - Multi-platform build
- `packages/opencode/script/publish.ts` - NPM publishing
- `packages/opencode/script/postinstall.mjs` - Platform detection
- `packages/opencode/bin/opencode` - Wrapper script
- `packages/opencode/src/installation/index.ts` - Auto-update logic
- `.github/workflows/publish.yml` - Release workflow
- `script/publish-start.ts` - Release orchestration

---

## Gotchas & Lessons

1. **Baseline builds are essential** - Many users have older CPUs without AVX2
2. **MUSL detection matters** - Alpine Linux is common in containers
3. **Postinstall must be robust** - Fallback to Node.js if Bun not available
4. **Version must be injected at build time** - No runtime lookups
5. **Upgrade detection is critical** - Users forget how they installed
6. **GitHub Actions matrix is powerful** - Build 5 platforms in parallel
7. **Changelog generation saves time** - Automate from git history
8. **Optional dependencies are key** - npm doesn't fail if platform binary unavailable

