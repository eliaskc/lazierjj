import type { Theme } from "../types"

export const opencodeTheme: Theme = {
	name: "opencode",
	colors: {
		primary: "#fab283",
		secondary: "#5c9cf5",
		background: "#0a0a0a",
		backgroundSecondary: "#141414",
		backgroundElement: "#1e1e1e",
		text: "#eeeeee",
		textMuted: "#808080",

		border: "#808080",
		borderFocused: "#eeeeee",

		selectionBackground: "#0A1D4D",
		selectionText: "#ffffff",

		success: "#12c905",
		warning: "#fcd53a",
		error: "#fc533a",
		info: "#5c9cf5",

		purple: "#9d7cd8",
		orange: "#f5a742",
		green: "#7fd88f",

		titleBarFocused: "#fab283",
		titleTextFocused: "#0a0a0a",
		titleTextMuted: "#6b4a30",

		statusBarKey: "#eeeeee",

		scrollbarTrack: "#1e1e1e",
		scrollbarThumb: "#484848",

		modes: {
			normal: { bg: "#303030", text: "#808080" },
			diff: { bg: "#5c9cf5", text: "#0a0a0a" },
			log: { bg: "#fcd53a", text: "#0a0a0a" },
			pr: { bg: "#9d7cd8", text: "#0a0a0a" },
		},
	},
	style: {
		panel: {
			borderStyle: "single",
		},
		statusBar: {
			separator: null,
		},
		dialog: {
			overlayOpacity: 150,
		},
		adaptToTerminal: false,
	},
}
