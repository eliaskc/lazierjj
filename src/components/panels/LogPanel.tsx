import { For, Show } from "solid-js"
import { useSync } from "../../context/sync"
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
			borderColor={isFocused() ? "#4ECDC4" : "#444444"}
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
						const content = () => commit.lines.join("\n")
						return (
							<box
								border={isSelected() ? ["left"] : undefined}
								borderColor={isSelected() ? "#4ECDC4" : undefined}
								paddingLeft={isSelected() ? 0 : 1}
							>
								<AnsiText content={content()} />
							</box>
						)
					}}
				</For>
			</Show>
		</box>
	)
}
