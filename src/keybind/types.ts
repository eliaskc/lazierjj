export interface KeybindInfo {
	name: string
	ctrl: boolean
	meta: boolean
	shift: boolean
}

export type KeybindConfigKey =
	| "quit"
	| "toggle_console"
	| "toggle_focus"
	| "nav_down"
	| "nav_up"
	| "nav_first"
	| "nav_last"
	| "help"
	| "refresh"

export type KeybindConfig = Record<KeybindConfigKey, string>

export const DEFAULT_KEYBINDS: KeybindConfig = {
	quit: "q",
	toggle_console: "§",
	toggle_focus: "tab,shift+tab",
	nav_down: "j,down",
	nav_up: "k,up",
	nav_first: "g",
	nav_last: "G",
	help: "?",
	refresh: "R",
}
