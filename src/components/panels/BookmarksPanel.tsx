import { For, Show } from "solid-js"
import { useCommand } from "../../context/command"
import { useFocus } from "../../context/focus"
import { useSync } from "../../context/sync"
import { colors } from "../../theme"

export function BookmarksPanel() {
	const {
		bookmarks,
		selectedBookmarkIndex,
		bookmarksLoading,
		bookmarksError,
		selectNextBookmark,
		selectPrevBookmark,
		selectFirstBookmark,
		selectLastBookmark,
		jumpToBookmarkCommit,
	} = useSync()
	const focus = useFocus()
	const command = useCommand()

	const isFocused = () => focus.is("bookmarks")

	const handleEnter = () => {
		const index = jumpToBookmarkCommit()
		if (index !== null) {
			focus.set("log")
		}
	}

	command.register(() => [
		{
			id: "bookmarks.next",
			title: "Next bookmark",
			keybind: "nav_down",
			context: "bookmarks",
			category: "Navigation",
			onSelect: selectNextBookmark,
		},
		{
			id: "bookmarks.prev",
			title: "Previous bookmark",
			keybind: "nav_up",
			context: "bookmarks",
			category: "Navigation",
			onSelect: selectPrevBookmark,
		},
		{
			id: "bookmarks.first",
			title: "First bookmark",
			keybind: "nav_first",
			context: "bookmarks",
			category: "Navigation",
			onSelect: selectFirstBookmark,
		},
		{
			id: "bookmarks.last",
			title: "Last bookmark",
			keybind: "nav_last",
			context: "bookmarks",
			category: "Navigation",
			onSelect: selectLastBookmark,
		},
		{
			id: "bookmarks.jump",
			title: "Jump to bookmark commit",
			keybind: "enter",
			context: "bookmarks",
			category: "Bookmarks",
			onSelect: handleEnter,
		},
	])

	const localBookmarks = () => bookmarks().filter((b) => b.isLocal)

	return (
		<box
			flexDirection="column"
			flexGrow={1}
			height="100%"
			border
			borderColor={isFocused() ? colors.borderFocused : colors.border}
			overflow="hidden"
			gap={0}
		>
			<box backgroundColor={colors.backgroundSecondary}>
				<text fg={isFocused() ? colors.primary : colors.textMuted}>
					[2] Bookmarks
				</text>
			</box>
			<Show when={bookmarksLoading()}>
				<text fg={colors.textMuted}>Loading bookmarks...</text>
			</Show>
			<Show when={bookmarksError()}>
				<text fg={colors.error}>Error: {bookmarksError()}</text>
			</Show>
			<Show when={!bookmarksLoading() && !bookmarksError()}>
				<Show
					when={localBookmarks().length > 0}
					fallback={<text fg={colors.textMuted}>No bookmarks</text>}
				>
					<For each={localBookmarks()}>
						{(bookmark, index) => {
							const isSelected = () => index() === selectedBookmarkIndex()
							return (
								<box
									backgroundColor={
										isSelected() ? colors.selectionBackground : undefined
									}
									overflow="hidden"
								>
									<text>
										<span style={{ fg: colors.primary }}>{bookmark.name}</span>
										<span style={{ fg: colors.textMuted }}>
											{" "}
											{bookmark.changeId.slice(0, 8)}
										</span>
									</text>
								</box>
							)
						}}
					</For>
				</Show>
			</Show>
		</box>
	)
}
