import { For, createMemo } from "solid-js"
import { useCommand } from "../context/command"
import { useFocus } from "../context/focus"
import { useKeybind } from "../context/keybind"
import { colors } from "../theme"

export function StatusBar() {
	const command = useCommand()
	const focus = useFocus()
	const keybind = useKeybind()

	const relevantCommands = createMemo(() => {
		const all = command.all()
		const currentFocus = focus.current()

		return all
			.filter(
				(cmd) =>
					cmd.keybind &&
					(cmd.context === "global" || cmd.context === currentFocus),
			)
			.slice(0, 8)
	})

	return (
		<box height={1} flexShrink={0} backgroundColor="#1a1b26">
			<For each={relevantCommands()}>
				{(cmd) => (
					<text>
						<span style={{ fg: colors.textTimestamp }}>
							{cmd.keybind ? keybind.print(cmd.keybind) : ""}
						</span>
						<span style={{ fg: "#666666" }}>:</span>
						<span style={{ fg: "#888888" }}>{cmd.title}</span>
						{"  "}
					</text>
				)}
			</For>
		</box>
	)
}
