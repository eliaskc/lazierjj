import { useRenderer } from "@opentui/solid"
import {
	type Accessor,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js"
import { createSimpleContext } from "./helper"

const NARROW_THRESHOLD = 100
const MEDIUM_THRESHOLD = 150

const LAYOUT_WIDE_REVISIONS = { left: 2, right: 3 }
const LAYOUT_WIDE_FILES = { left: 3, right: 7 }
const LAYOUT_MEDIUM_REVISIONS = { left: 1, right: 1 }
const LAYOUT_MEDIUM_FILES = { left: 2, right: 3 }

export const { use: useLayout, provider: LayoutProvider } = createSimpleContext(
	{
		name: "Layout",
		init: () => {
			const renderer = useRenderer()

			const [terminalWidth, setTerminalWidth] = createSignal(renderer.width)
			const [terminalHeight, setTerminalHeight] = createSignal(renderer.height)
			const [logPanelInFilesMode, setLogPanelInFilesMode] = createSignal(false)

			onMount(() => {
				const handleResize = (width: number, height: number) => {
					setTerminalWidth(width)
					setTerminalHeight(height)
				}
				renderer.on("resize", handleResize)
				onCleanup(() => renderer.off("resize", handleResize))
			})

			const isNarrow = createMemo(() => terminalWidth() < NARROW_THRESHOLD)

			const isMedium = createMemo(() => terminalWidth() < MEDIUM_THRESHOLD)

			const layoutRatio = createMemo(() => {
				if (isMedium()) {
					return logPanelInFilesMode()
						? LAYOUT_MEDIUM_FILES
						: LAYOUT_MEDIUM_REVISIONS
				}
				return logPanelInFilesMode() ? LAYOUT_WIDE_FILES : LAYOUT_WIDE_REVISIONS
			})

			const mainAreaWidth = createMemo(() => {
				const width = terminalWidth()
				const { left, right } = layoutRatio()
				const ratio = right / (left + right)
				const borderWidth = 2
				return Math.floor(width * ratio) - borderWidth
			})

			return {
				terminalWidth,
				terminalHeight,
				layoutRatio,
				mainAreaWidth,
				isNarrow,
				setLogPanelInFilesMode,
			}
		},
	},
)
