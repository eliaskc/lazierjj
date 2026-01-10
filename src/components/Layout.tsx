import { type JSX, Show } from "solid-js"
import { useLayout } from "../context/layout"
import { useTheme } from "../context/theme"
import { StatusBar } from "./StatusBar"
import { CommandLogPanel } from "./panels/CommandLogPanel"

interface LayoutProps {
	top: JSX.Element
	bottom: JSX.Element
	right: JSX.Element
}

export function Layout(props: LayoutProps) {
	const { colors, style } = useTheme()
	const { layoutRatio, focusMode } = useLayout()

	return (
		<box
			flexGrow={1}
			flexDirection="column"
			width="100%"
			height="100%"
			backgroundColor={colors().background}
			padding={style().adaptToTerminal ? 0 : 1}
			gap={0}
		>
			<box flexGrow={1} flexDirection="row" width="100%" gap={0}>
				<box
					flexGrow={layoutRatio().left}
					flexBasis={0}
					height="100%"
					flexDirection="column"
					gap={0}
				>
					<box flexGrow={focusMode() === "diff" ? 1 : 3} flexBasis={0}>
						{props.top}
					</box>
					<Show when={focusMode() === "normal"}>
						<box flexGrow={1} flexBasis={0}>
							{props.bottom}
						</box>
					</Show>
				</box>
				<box
					flexGrow={layoutRatio().right}
					flexBasis={0}
					height="100%"
					flexDirection="column"
				>
					<box flexGrow={1}>{props.right}</box>
					<Show when={focusMode() === "normal"}>
						<CommandLogPanel />
					</Show>
				</box>
			</box>
			<StatusBar />
		</box>
	)
}
