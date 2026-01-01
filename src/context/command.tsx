import { useKeyboard } from "@opentui/solid"
import { type Accessor, createMemo, createSignal, onCleanup } from "solid-js"
import type { KeybindConfigKey } from "../keybind"
import { useDialog } from "./dialog"
import { type FocusContext, useFocus } from "./focus"
import { createSimpleContext } from "./helper"
import { useKeybind } from "./keybind"

export type CommandOption = {
	id: string
	title: string
	keybind?: KeybindConfigKey
	context?: FocusContext | "global"
	category?: string
	hidden?: boolean
	onSelect: () => void
}

export const { use: useCommand, provider: CommandProvider } =
	createSimpleContext({
		name: "Command",
		init: () => {
			const [registrations, setRegistrations] = createSignal<
				Accessor<CommandOption[]>[]
			>([])
			const keybind = useKeybind()
			const focus = useFocus()
			const dialog = useDialog()

			const allCommands = createMemo(() => {
				return registrations().flatMap((r) => r())
			})

			useKeyboard((evt) => {
				const dialogOpen = dialog.isOpen()

				for (const cmd of allCommands()) {
					// When dialog is open, only allow help toggle (escape is handled by dialog.tsx)
					if (dialogOpen && cmd.keybind !== "help") {
						continue
					}

					if (
						!dialogOpen &&
						cmd.context &&
						cmd.context !== "global" &&
						cmd.context !== focus.current()
					) {
						continue
					}

					if (cmd.keybind && keybind.match(cmd.keybind, evt)) {
						evt.preventDefault()
						cmd.onSelect()
						return
					}
				}
			})

			return {
				register: (cb: () => CommandOption[]) => {
					const accessor = createMemo(cb)
					setRegistrations((arr) => [...arr, accessor])
					onCleanup(() => {
						setRegistrations((arr) => arr.filter((r) => r !== accessor))
					})
				},

				trigger: (id: string) => {
					const cmd = allCommands().find((c) => c.id === id)
					cmd?.onSelect()
				},

				all: allCommands,
			}
		},
	})
