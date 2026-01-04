# Releasing kajji

## Quick Release

```bash
# 1. Bump version in package.json
# 2. Build, publish, release:
bun run script/build.ts
bun run script/publish.ts
git tag v<version>
git push origin v<version>
gh release create v<version> dist/*.tar.gz dist/*.zip --title "v<version>"
gh release edit v<version> --prerelease=false
```

## Step-by-Step

### 1. Bump version

Edit `package.json` and update the version number.

### 2. Build binaries

```bash
bun run script/build.ts
```

Compiles binaries for all platforms:
- darwin-arm64, darwin-x64
- linux-arm64, linux-x64

Output: `dist/kajji-{os}-{arch}/`

### 3. Publish to npm

```bash
bun run script/publish.ts
```

Publishes:
- 4 platform packages (`kajji-darwin-arm64`, etc.)
- 1 wrapper package (`kajji`)

Creates archives in `dist/`:
- `kajji-darwin-*.zip`
- `kajji-linux-*.tar.gz`

### 4. Create git tag

```bash
git tag v<version>
git push origin v<version>
```

### 5. Create GitHub release

```bash
gh release create v<version> dist/*.tar.gz dist/*.zip --title "v<version>"
```

### 6. Mark as latest

```bash
gh release edit v<version> --prerelease=false
```

Required for `curl` install to work (uses `/releases/latest/`).

## Verify

```bash
# npm install
npm install -g kajji@<version>
kajji

# curl install
curl -fsSL https://raw.githubusercontent.com/eliaskc/kajji/main/install.sh | bash
~/.kajji/bin/kajji
```

## Release Notes

**GitHub**: Add `--notes` flag or `--notes-file`:

```bash
# inline
gh release create v<version> dist/*.tar.gz dist/*.zip --title "v<version>" --notes "- Fixed foo
- Added bar"

# from file
gh release create v<version> dist/*.tar.gz dist/*.zip --title "v<version>" --notes-file CHANGELOG.md

# auto-generate from commits
gh release create v<version> dist/*.tar.gz dist/*.zip --title "v<version>" --generate-notes
```

**npm**: npm doesn't have release notes. The README is the main documentation. For changelogs, either:
- Keep a `CHANGELOG.md` in the repo (shown on npm if linked in README)
- Use GitHub releases as the canonical changelog

## Stats

```bash
# npm downloads (last week)
curl -s https://api.npmjs.org/downloads/point/last-week/kajji | jq

# npm downloads (last month)
curl -s https://api.npmjs.org/downloads/point/last-month/kajji | jq

# GitHub release downloads
gh release view v<version> --json assets --jq '.assets[] | "\(.name): \(.downloadCount)"'

# all releases
gh release list
```

**Web dashboards**:
- https://www.npmjs.com/package/kajji
- https://npm-stat.com/charts.html?package=kajji
