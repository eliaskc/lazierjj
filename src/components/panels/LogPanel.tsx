import { For, Show } from "solid-js"
import { useSync } from "../../context/sync"
import { colors } from "../../theme"
import { AnsiText } from "../AnsiText"

export function LogPanel() {
	const { commits, selectedIndex, loading, error, focusedPanel } = useSync()
	const isFocused = () => focusedPanel() === "log"

	return (
		<box
			flexDirection="column"
			flexGrow={1}
			height="100%"
			border
			borderColor={isFocused() ? colors.borderFocused : colors.borderDefault}
			overflow="hidden"
			gap={0}
		>
			<Show when={loading()}>
				<text>Loading...</text>
			</Show>
			<Show when={error()}>
				<text>Error: {error()}</text>
			</Show>
			<Show when={!loading() && !error()}>
				<For each={commits()}>
					{(commit, index) => {
						const isSelected = () => index() === selectedIndex()
						return (
							<For each={commit.lines}>
								{(line) => (
									<box
										backgroundColor={
											isSelected() ? colors.selectionBg : undefined
										}
										overflow="hidden"
									>
										<AnsiText
											content={line}
											bold={commit.isWorkingCopy}
											wrapMode="none"
										/>
									</box>
								)}
							</For>
						)
					}}
				</For>
			</Show>
		</box>
	)
}
