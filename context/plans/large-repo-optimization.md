# Large Repo Optimization

**Status**: Planning
**Priority**: High
**Goal**: Make kajji responsive on repos with 1000+ commits and 100+ bookmarks

---

## Problems

1. **Slow startup with many bookmarks** — `jj bookmark list` blocks UI
2. **Slow startup with large log** — initial `jj log` can be slow on deep history
3. **Post-operation lag** — operation completes but UI takes seconds to refresh

---

## Solutions

### 1. Lazy/Paginated Revision Loading

Don't load entire commit history upfront. Load initial batch, fetch more on scroll.

### 2. Lazy Bookmark Loading

Same pattern for bookmarks — show panel immediately, populate async.

### 3. Smarter Bookmark Sorting

Sort by relevance, not alphabetically:
- Recently modified first
- Local/user-modified before remote-only

### 4. Bookmark Grouping

Visual separation:
- **Local** — user has modified (commits ahead of remote, or no remote)
- **Remote** — tracking remote, no local changes

---

## Open Questions

### Bookmark "recently modified" signal

What data do we have to determine recency?

Options:
1. **jj bookmark list** output — does it include timestamps?
2. **Infer from commit activity** — check if bookmark's commit is in recent log
3. **Track locally** — store last-touched timestamp in `~/.config/kajji/state.json`
4. **Use git reflog equivalent** — jj op log might have bookmark movement history

Need to investigate `jj bookmark list` output format and available metadata.

### Default limits

What's the right initial load size?

| List | Current | Proposed | Trigger |
|------|---------|----------|---------|
| Revisions | All visible | 50-100? | Scroll near bottom |
| Bookmarks | All | 50? | Scroll near bottom |
| Oplog | 50 | 50 (already done) | Scroll near bottom |

Should limits be configurable? Or auto-tune based on performance?

### Parallel fetching

Can we fetch log + bookmarks in parallel on startup? Currently sequential.

---

## Implementation Notes

- Oplog already has lazy loading pattern — reuse for revisions/bookmarks
- Consider debouncing/batching post-operation refreshes
- May need loading indicators for lists that are still populating
