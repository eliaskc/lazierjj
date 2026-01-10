import { useRenderer } from "@opentui/solid"
import {
	type Accessor,
	createMemo,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js"
import { createSimpleContext } from "./helper"

const HELP_MODAL_1_COL_THRESHOLD = 90
const HELP_MODAL_2_COL_THRESHOLD = 130

const LAYOUT_NORMAL = { left: 1, right: 1 }
const LAYOUT_DIFF = { left: 1, right: 4 }

export type FocusMode = "normal" | "diff"

export const { use: useLayout, provider: LayoutProvider } = createSimpleContext(
	{
		name: "Layout",
		init: () => {
			const renderer = useRenderer()

			const [terminalWidth, setTerminalWidth] = createSignal(renderer.width)
			const [terminalHeight, setTerminalHeight] = createSignal(renderer.height)

			const [focusMode, setFocusModeInternal] =
				createSignal<FocusMode>("normal")
			const [previousMode, setPreviousMode] = createSignal<FocusMode>("normal")

			const setFocusMode = (mode: FocusMode) => {
				setPreviousMode(focusMode())
				setFocusModeInternal(mode)
			}

			const toggleFocusMode = () => {
				setFocusMode(focusMode() === "normal" ? "diff" : "normal")
			}

			const returnToPreviousMode = () => {
				setFocusModeInternal(previousMode())
			}

			onMount(() => {
				const handleResize = (width: number, height: number) => {
					setTerminalWidth(width)
					setTerminalHeight(height)
				}
				renderer.on("resize", handleResize)
				onCleanup(() => renderer.off("resize", handleResize))
			})

			const helpModalColumns = createMemo(() => {
				const width = terminalWidth()
				if (width < HELP_MODAL_1_COL_THRESHOLD) return 1
				if (width < HELP_MODAL_2_COL_THRESHOLD) return 2
				return 3
			})

			const layoutRatio = createMemo(() => {
				return focusMode() === "diff" ? LAYOUT_DIFF : LAYOUT_NORMAL
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
				helpModalColumns,
				focusMode,
				setFocusMode,
				toggleFocusMode,
				returnToPreviousMode,
			}
		},
	},
)
