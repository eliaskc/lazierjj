import type { JSX } from "solid-js"
import { StatusBar } from "./StatusBar"

interface LayoutProps {
	top: JSX.Element
	bottom: JSX.Element
	right: JSX.Element
}

export function Layout(props: LayoutProps) {
	return (
		<box flexGrow={1} flexDirection="column" width="100%" height="100%">
			<box flexGrow={1} flexDirection="row" width="100%">
				<box flexGrow={1} flexBasis={0} height="100%" flexDirection="column">
					<box flexGrow={3} flexBasis={0}>
						{props.top}
					</box>
					<box flexGrow={1} flexBasis={0}>
						{props.bottom}
					</box>
				</box>
				<box flexGrow={2} flexBasis={0} height="100%">
					{props.right}
				</box>
			</box>
			<StatusBar />
		</box>
	)
}
