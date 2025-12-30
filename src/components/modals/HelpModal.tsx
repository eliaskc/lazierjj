import { type Accessor, For, Show, createMemo, createSignal } from "solid-js"
import { useCommand, type CommandOption } from "../../context/command"
import type { KeybindConfigKey } from "../../keybind"
import { useDialog } from "../../context/dialog"
import { useKeybind } from "../../context/keybind"
import { colors } from "../../theme"

interface CategoryGroup {
	name: string
	commands: CommandOption[]
}

export function HelpModal() {
	const command = useCommand()
	const keybind = useKeybind()
	const dialog = useDialog()
	const [filter, setFilter] = createSignal("")

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

	const columnCount = 3
	const columns = createMemo(() => {
		const groups = groupedCommands()
		const cols: CategoryGroup[][] = Array.from(
			{ length: columnCount },
			() => [],
		)

		let colIndex = 0
		for (const group of groups) {
			const col = cols[colIndex]
			if (col) col.push(group)
			colIndex = (colIndex + 1) % columnCount
		}

		return cols
	})

	return (
		<box
			flexDirection="column"
			border
			borderColor={colors.borderFocused}
			backgroundColor="#1a1b26"
			padding={1}
			width="90%"
			height="80%"
		>
			<box flexDirection="row" marginBottom={1}>
				<text fg={colors.textAuthor}>Search: </text>
				<input
					focused
					placeholder="Type to filter..."
					onInput={(value) => setFilter(value)}
					onSubmit={() => dialog.close()}
				/>
			</box>

			<box flexDirection="row" flexGrow={1} gap={2}>
				<For each={columns()}>
					{(column) => (
						<box flexDirection="column" flexGrow={1} flexBasis={0}>
							<For each={column}>
								{(group) => (
									<box flexDirection="column" marginBottom={1}>
										<text fg={colors.borderFocused}>
											<b>{group.name}</b>
										</text>
										<For each={group.commands}>
											{(cmd) => (
												<text>
													<Show
														when={cmd.keybind}
														fallback={<span>{"        "}</span>}
													>
														{(kb: Accessor<KeybindConfigKey>) => (
															<span style={{ fg: colors.textTimestamp }}>
																{keybind.print(kb()).padEnd(8)}
															</span>
														)}
													</Show>{" "}
													{cmd.title}
												</text>
											)}
										</For>
									</box>
								)}
							</For>
						</box>
					)}
				</For>
			</box>

			<box marginTop={1}>
				<text fg="#666666">Press Esc or Enter to close</text>
			</box>
		</box>
	)
}
