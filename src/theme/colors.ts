export const colors = {
	primary: "#fab283",
	background: "#0a0a0a",
	backgroundSecondary: "#141414",
	backgroundElement: "#1e1e1e",

	text: "#eeeeee",
	textMuted: "#808080",

	border: "#606060",
	borderFocused: "#909090",

	selectionBackground: "#323232",
	selectionText: "#eeeeee",

	success: "#7fd88f",
	warning: "#f5a742",
	error: "#e06c75",
	info: "#56b6c2",
} as const

export type Colors = typeof colors
