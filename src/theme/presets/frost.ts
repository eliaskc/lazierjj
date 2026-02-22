import type { Theme } from "../types"

export const frostTheme: Theme = {
	name: "frost",
	colors: {
		primary: "#7dcfff",
		secondary: "#bb9af7",
		background: "#0a0a0a",
		backgroundSecondary: "#121218",
		backgroundElement: "#1a1a24",
		backgroundDialog: "#16162e",

		text: "#c0caf5",
		textMuted: "#6b7089",

		border: "#6b7089",
		borderFocused: "#7dcfff",

		selectionBackground: "#1e2440",
		selectionText: "#c0caf5",

		success: "#9ece6a",
		warning: "#e0af68",
		error: "#f7768e",
		info: "#7aa2f7",

		purple: "#bb9af7",
		orange: "#ff9e64",
		green: "#9ece6a",

		titleBar: "#1a1a24",
		titleBarFocused: "#7dcfff",
		titleTextFocused: "#0a0a0a",
		titleTextMuted: "#2a4a5a",

		scrollbarTrack: "#1a1a24",
		scrollbarThumb: "#3b4261",

		modes: {
			normal: { bg: "#24283b", text: "#6b7089" },
			diff: { bg: "#7aa2f7", text: "#0a0a0a" },
			log: { bg: "#e0af68", text: "#0a0a0a" },
			pr: { bg: "#bb9af7", text: "#0a0a0a" },
		},
	},
	style: {
		panel: {
			borderStyle: "rounded",
		},
		statusBar: {
			separator: "•",
		},
		dialog: {
			overlayOpacity: 150,
		},
		adaptToTerminal: false,
	},
}
