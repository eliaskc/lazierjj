import type { JSX } from "solid-js"
import { useTheme } from "../context/theme"

interface PanelProps {
	title: string
	hotkey: string
	focused: boolean
	children: JSX.Element
}

export function Panel(props: PanelProps) {
	const { colors, style } = useTheme()

	return (
		<box
			flexDirection="column"
			flexGrow={1}
			height="100%"
			border
			borderStyle={style().panel.borderStyle}
			borderColor={props.focused ? colors().borderFocused : colors().border}
			title={`[${props.hotkey}]─${props.title}`}
			overflow="hidden"
			gap={0}
		>
			{props.children}
		</box>
	)
}
