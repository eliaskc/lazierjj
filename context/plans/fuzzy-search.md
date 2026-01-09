# Fuzzy Search Infrastructure

**Status**: Planning
**Priority**: Medium
**Goal**: Consistent fuzzy search/filtering across all list views

---

## Scope

Add fuzzy filtering to:
- [ ] Bookmark picker (in dialogs)
- [ ] Commits list (log.revisions, bookmarks.commits)
- [ ] Bookmarks tab (bookmarks.list)
- [ ] Oplog (log.oplog)
- [ ] File tree (log.files, bookmarks.files)
- [ ] Revset picker

---

## UX Pattern

### Activation
- `/` to enter search mode in any list view
- Or start typing immediately (if no conflicting keybinds)

### Display
- Search input appears at top/bottom of list (configurable?)
- List filters in real-time as user types
- Match highlighting in results
- `Escape` to clear and exit search mode
- `Enter` to select current item (keeps filter)

### Behavior
- Fuzzy matching (not just prefix/substring)
- Case insensitive by default
- Match on relevant fields:
  - Bookmarks: name
  - Commits: description, author, change ID
  - Files: path
  - Oplog: operation type, description

---

## Implementation

### Shared Hook/Component

```typescript
// Hook for fuzzy filtering any list
function useFuzzyFilter<T>(
  items: T[],
  getSearchableText: (item: T) => string,
  options?: { threshold?: number }
): {
  filtered: T[]
  query: string
  setQuery: (q: string) => void
  isFiltering: boolean
}

// Or a wrapper component
<FuzzyFilterList
  items={bookmarks}
  getKey={(b) => b.name}
  getSearchText={(b) => b.name}
  renderItem={(b, highlighted) => <BookmarkRow bookmark={b} />}
  onSelect={(b) => selectBookmark(b)}
/>
```

### Library

Already using `fuzzysort` — extend usage to all lists.

---

## Open Questions

### Search input placement

Options:
1. **Top of list** — like VS Code command palette
2. **Bottom of list** — like vim `/` search
3. **Overlay/modal** — separate from list
4. **Inline in panel title** — compact

Need to consider:
- Space constraints in TUI
- Consistency with existing patterns
- What lazygit/lazyjj do

### Keybind conflicts

`/` is intuitive but might conflict with future features:
- Revset filtering uses `/` in some tools
- vim-style search

Could use `ctrl+f` or `f` instead, but `/` feels more natural.

### Scope: filter vs search

**Filter** = reduce visible items to matches (current plan)
**Search** = highlight matches but keep all items visible

Filter is more useful for large lists. Search is better for orientation.

Could support both:
- `/` for filter mode
- `ctrl+f` for highlight-only search?

Or just start with filter, add search later if needed.

### Performance

Fuzzy matching on every keystroke could be slow for 1000+ items.
- Debounce input (50-100ms)?
- Use fuzzysort's sorting/limiting options?
- Virtualize filtered results too?

---

## Integration with Other Features

### Large Repo Optimization

Fuzzy search becomes more important with lazy loading:
- Can't scroll through 1000 commits to find one
- Search is primary navigation method for large lists

### Bookmark Sorting

Search results should respect sort order:
- Best fuzzy match first
- Within equal matches, use recency sort
