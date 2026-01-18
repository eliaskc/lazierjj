import {
	RGBA,
	type ScrollBoxRenderable,
	type TextareaRenderable,
} from "@opentui/core"
import { useKeyboard } from "@opentui/solid"
import fuzzysort from "fuzzysort"
import { For, Show, createEffect, createMemo, createSignal } from "solid-js"
import type { Bookmark } from "../../commander/bookmarks"
import { useDialog } from "../../context/dialog"
import { useTheme } from "../../context/theme"
import { BorderBox } from "../BorderBox"

const SINGLE_LINE_KEYBINDINGS = [
	{ name: "return", action: "submit" as const },
	{ name: "enter", action: "submit" as const },
]

interface SetBookmarkModalProps {
	title: string
	bookmarks: Bookmark[]
	changeId: string
	onMove: (bookmark: Bookmark) => void
	onCreate: (name: string) => void
}

type ListItem =
	| { type: "bookmark"; bookmark: Bookmark }
	| { type: "create"; name: string }

export function SetBookmarkModal(props: SetBookmarkModalProps) {
	const dialog = useDialog()
	const { colors, style } = useTheme()

	const [query, setQuery] = createSignal("")
	const [selectedIndex, setSelectedIndex] = createSignal(0)
	const [error, setError] = createSignal<string | null>(null)
	const [scrollTop, setScrollTop] = createSignal(0)

	let inputRef: TextareaRenderable | undefined
	let scrollRef: ScrollBoxRenderable | undefined

	// Filter bookmarks with fuzzy search
	const filteredBookmarks = createMemo(() => {
		const q = query().trim()
		if (!q) return props.bookmarks

		const results = fuzzysort.go(q, props.bookmarks, {
			key: "name",
			threshold: -500, // Stricter threshold
			limit: 50,
		})
		return results.map((r) => r.obj)
	})

	// Show create option when: input non-empty AND no exact match
	const showCreateOption = createMemo(() => {
		const q = query().trim()
		if (!q) return false
		return !props.bookmarks.some((b) => b.name === q)
	})

	// Unified list: bookmarks first, then create option (if shown)
	// Using a single array ensures correct ordering
	const listItems = createMemo((): ListItem[] => {
		const items: ListItem[] = filteredBookmarks().map((b) => ({
			type: "bookmark" as const,
			bookmark: b,
		}))

		if (showCreateOption()) {
			items.push({
				type: "create" as const,
				name: query().trim(),
			})
		}

		return items
	})

	// Total items count
	const totalItems = createMemo(() => listItems().length)

	// Is create option currently selected?
	const isCreateSelected = createMemo(() => {
		const items = listItems()
		const item = items[selectedIndex()]
		return item?.type === "create"
	})

	// Get selected bookmark (null if create option selected or nothing)
	const selectedBookmark = createMemo(() => {
		const items = listItems()
		const item = items[selectedIndex()]
		if (item?.type === "bookmark") return item.bookmark
		return null
	})

	// Placeholder: show selected bookmark name, or default
	const placeholder = createMemo(() => {
		const bookmark = selectedBookmark()
		if (bookmark) return bookmark.name
		return `push-${props.changeId.slice(0, 8)}`
	})

	// Clamp selection when list changes
	createEffect(() => {
		const total = totalItems()
		if (total === 0) {
			setSelectedIndex(0)
		} else if (selectedIndex() >= total) {
			setSelectedIndex(Math.max(0, total - 1))
		}
	})

	// Auto-select create option when it's the only item
	createEffect(() => {
		const items = listItems()
		if (items.length === 1 && items[0]?.type === "create") {
			setSelectedIndex(0)
		}
	})

	// Scroll selected item into view
	const scrollToIndex = (index: number) => {
		if (!scrollRef || totalItems() === 0) return

		const margin = 2
		const refAny = scrollRef as unknown as Record<string, unknown>
		const viewportHeight =
			(typeof refAny.height === "number" ? refAny.height : null) ??
			(typeof refAny.rows === "number" ? refAny.rows : null) ??
			10
		const currentScrollTop = scrollTop()

		const visibleStart = currentScrollTop
		const visibleEnd = currentScrollTop + viewportHeight - 1
		const safeStart = visibleStart + margin
		const safeEnd = visibleEnd - margin

		let newScrollTop = currentScrollTop
		if (index < safeStart) {
			newScrollTop = Math.max(0, index - margin)
		} else if (index > safeEnd) {
			newScrollTop = Math.max(0, index - viewportHeight + margin + 1)
		}

		if (newScrollTop !== currentScrollTop) {
			scrollRef.scrollTo(newScrollTop)
			setScrollTop(newScrollTop)
		}
	}

	createEffect(() => {
		scrollToIndex(selectedIndex())
	})

	const selectPrev = () => {
		setSelectedIndex((i) => Math.max(0, i - 1))
	}

	const selectNext = () => {
		const max = totalItems() - 1
		if (max < 0) return
		setSelectedIndex((i) => Math.min(max, i + 1))
	}

	const handleSubmit = () => {
		setError(null)

		if (isCreateSelected()) {
			const name = query().trim()
			if (!name) {
				setError("Name cannot be empty")
				return
			}
			if (/\s/.test(name)) {
				setError("Name cannot contain spaces")
				return
			}
			dialog.close()
			props.onCreate(name)
		} else {
			const bookmark = selectedBookmark()
			if (bookmark) {
				dialog.close()
				props.onMove(bookmark)
			}
		}
	}

	// Only use arrow keys for navigation (not j/k - they block typing)
	useKeyboard((evt) => {
		if (evt.name === "escape") {
			evt.preventDefault()
			evt.stopPropagation()
			dialog.close()
		} else if (evt.name === "down") {
			evt.preventDefault()
			evt.stopPropagation()
			selectNext()
		} else if (evt.name === "up") {
			evt.preventDefault()
			evt.stopPropagation()
			selectPrev()
		}
	})

	const hasBookmarks = () => props.bookmarks.length > 0
	const showPlaceholderText = () => !query().trim() && !hasBookmarks()

	// Fixed list height
	const LIST_HEIGHT = 10

	// Generate a stable key for each item
	const getItemKey = (item: ListItem): string => {
		if (item.type === "bookmark") {
			return `bookmark:${item.bookmark.name}`
		}
		return `create:${item.name}`
	}

	return (
		<BorderBox
			border
			borderStyle={style().panel.borderStyle}
			borderColor={colors().borderFocused}
			backgroundColor={colors().background}
			width="60%"
			topLeft={<text fg={colors().borderFocused}>{props.title}</text>}
		>
			<box flexDirection="column">
				{/* Search/create input */}
				<box paddingLeft={1} paddingRight={1}>
					<textarea
						ref={(r) => {
							inputRef = r
							setTimeout(() => {
								r.requestRender?.()
								r.focus()
							}, 1)
						}}
						initialValue=""
						placeholder={placeholder()}
						onContentChange={() => {
							if (inputRef) {
								setQuery(inputRef.plainText)
								setError(null)
								// Reset selection to first item when typing
								setSelectedIndex(0)
							}
						}}
						onSubmit={handleSubmit}
						keyBindings={SINGLE_LINE_KEYBINDINGS}
						wrapMode="none"
						scrollMargin={0}
						cursorColor={colors().primary}
						textColor={colors().text}
						focusedTextColor={colors().text}
						focusedBackgroundColor={RGBA.fromInts(0, 0, 0, 0)}
						flexGrow={1}
					/>
				</box>

				{/* Divider */}
				<box height={1} overflow="hidden">
					<text fg={colors().textMuted} wrapMode="none">
						{"─".repeat(200)}
					</text>
				</box>

				{/* Filtered list + create option - unified rendering */}
				<Show
					when={!showPlaceholderText()}
					fallback={
						<box height={LIST_HEIGHT} paddingLeft={1} paddingRight={1}>
							<text fg={colors().textMuted}>Type to create a bookmark</text>
						</box>
					}
				>
					<scrollbox
						ref={scrollRef}
						height={LIST_HEIGHT}
						scrollbarOptions={{ visible: false }}
					>
						<For each={listItems()}>
							{(item, index) => {
								const isSelected = () => index() === selectedIndex()

								if (item.type === "bookmark") {
									const bookmark = item.bookmark
									return (
										<box
											backgroundColor={
												isSelected() ? colors().selectionBackground : undefined
											}
											paddingLeft={1}
											paddingRight={1}
											onMouseDown={() => setSelectedIndex(index())}
										>
											<text wrapMode="none">
												<span style={{ fg: colors().primary }}>
													{bookmark.name}
												</span>
												<span style={{ fg: colors().textMuted }}>
													{" "}
													{bookmark.changeId.slice(0, 8)}
												</span>
												<Show when={bookmark.description}>
													<span style={{ fg: colors().text }}>
														{" "}
														{bookmark.description}
													</span>
												</Show>
											</text>
										</box>
									)
								}

								// Create option
								return (
									<box
										backgroundColor={
											isSelected() ? colors().selectionBackground : undefined
										}
										paddingLeft={1}
										paddingRight={1}
										onMouseDown={() => setSelectedIndex(index())}
									>
										<text fg={colors().textMuted} wrapMode="none">
											+ Create "{item.name}"
										</text>
									</box>
								)
							}}
						</For>
					</scrollbox>
				</Show>

				{/* Error display */}
				<Show when={error()}>
					<box
						border
						borderStyle={style().panel.borderStyle}
						borderColor={colors().error}
						marginLeft={1}
						marginRight={1}
						marginBottom={1}
						paddingLeft={1}
					>
						<text fg={colors().error}>{error()}</text>
					</box>
				</Show>
			</box>
		</BorderBox>
	)
}
