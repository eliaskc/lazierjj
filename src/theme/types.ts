export interface ThemeColors {
	primary: string
	secondary: string
	background: string
	backgroundSecondary: string
	backgroundElement: string

	text: string
	textMuted: string

	border: string
	borderFocused: string

	selectionBackground: string
	selectionText: string

	success: string
	warning: string
	error: string
	info: string

	purple: string
	orange: string
	green: string

	scrollbarTrack: string
	scrollbarThumb: string
}

export interface ThemeStyle {
	panel: {
		borderStyle: "rounded" | "single"
	}
	statusBar: {
		separator: string | null
	}
	dialog: {
		overlayOpacity: number
	}
	adaptToTerminal: boolean
}

export interface Theme {
	name: string
	colors: ThemeColors
	style: ThemeStyle
}
