import { RGBA, type InputRenderable } from "@opentui/core"
import { useRenderer } from "@opentui/solid"
import {
	type Accessor,
	For,
	Show,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js"
import { type CommandOption, useCommand } from "../../context/command"
import { useDialog } from "../../context/dialog"
import { useKeybind } from "../../context/keybind"
import { useTheme } from "../../context/theme"
import type { KeybindConfigKey } from "../../keybind"

interface CategoryGroup {
	name: string
	commands: CommandOption[]
}

const NARROW_THRESHOLD = 100

export function HelpModal() {
	const renderer = useRenderer()
	const command = useCommand()
	const keybind = useKeybind()
	const dialog = useDialog()
	const { colors, style } = useTheme()
	const [filter, setFilter] = createSignal("")
	const [terminalWidth, setTerminalWidth] = createSignal(renderer.width)

	onMount(() => {
		const handleResize = (width: number) => setTerminalWidth(width)
		renderer.on("resize", handleResize)
		onCleanup(() => renderer.off("resize", handleResize))
	})

	const columnCount = () => (terminalWidth() < NARROW_THRESHOLD ? 1 : 3)

	const groupedCommands = createMemo(() => {
		const all = command.all()
		const filterText = filter().toLowerCase()

		const filtered = filterText
			? all.filter(
					(cmd) =>
						cmd.title.toLowerCase().includes(filterText) ||
						cmd.category?.toLowerCase().includes(filterText) ||
						(cmd.keybind && keybind.print(cmd.keybind).includes(filterText)),
				)
			: all

		const groups = new Map<string, CommandOption[]>()
		for (const cmd of filtered) {
			const category = cmd.category || "Other"
			const existing = groups.get(category) || []
			groups.set(category, [...existing, cmd])
		}

		const result: CategoryGroup[] = []
		for (const [name, commands] of groups) {
			result.push({ name, commands })
		}

		return result.sort((a, b) => a.name.localeCompare(b.name))
	})

	const columns = createMemo(() => {
		const groups = groupedCommands()
		const numCols = columnCount()
		const cols: CategoryGroup[][] = Array.from({ length: numCols }, () => [])

		let colIndex = 0
		for (const group of groups) {
			const col = cols[colIndex]
			if (col) col.push(group)
			colIndex = (colIndex + 1) % numCols
		}

		return cols
	})

	const separator = () => style().statusBar.separator
	const gap = () => (separator() ? 0 : 3)

	return (
		<box
			flexDirection="column"
			border
			borderStyle={style().panel.borderStyle}
			borderColor={colors().borderFocused}
			backgroundColor={colors().background}
			padding={1}
			width="80%"
			height="80%"
			title="Commands"
		>
			<box flexDirection="row" marginBottom={2} paddingLeft={4}>
				<input
					ref={(r: InputRenderable) => setTimeout(() => r.focus(), 1)}
					onInput={(value) => setFilter(value)}
					onSubmit={() => dialog.close()}
					placeholder="Search"
					flexGrow={1}
					cursorColor={colors().primary}
					textColor={colors().textMuted}
					focusedTextColor={colors().text}
					focusedBackgroundColor={RGBA.fromInts(0, 0, 0, 0)}
				/>
			</box>

			<box flexDirection="row" flexGrow={1} gap={1}>
				<For each={columns()}>
					{(column) => (
						<box flexDirection="column" flexGrow={1} flexBasis={0}>
							<For each={column}>
								{(group) => (
									<box flexDirection="column" marginBottom={1}>
										<box flexDirection="row">
											<box width={10} flexShrink={0} />
											<text fg={colors().primary}> {group.name}</text>
										</box>
										<For each={group.commands}>
											{(cmd) => (
												<box flexDirection="row">
													<box width={10} flexShrink={0}>
														<Show when={cmd.keybind}>
															{(kb: Accessor<KeybindConfigKey>) => (
																<text fg={colors().info} wrapMode="none">
																	{keybind.print(kb()).padStart(9)}
																</text>
															)}
														</Show>
													</box>
													<text fg={colors().text}> {cmd.title}</text>
												</box>
											)}
										</For>
									</box>
								)}
							</For>
						</box>
					)}
				</For>
			</box>

			<box marginTop={1} flexDirection="row" gap={gap()}>
				<text>
					<span style={{ fg: colors().primary }}>esc or ?</span>
					<span style={{ fg: colors().text }}> Close</span>
				</text>

				{/* TODO: only show when a command is selected */}
				<text>
					<Show when={separator()}>
						<span style={{ fg: colors().textMuted }}>{` ${separator()} `}</span>
					</Show>
					<span style={{ fg: colors().primary }}>enter</span>
					<span style={{ fg: colors().text }}> Run command</span>
				</text>
			</box>
		</box>
	)
}
