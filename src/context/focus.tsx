import { createSignal } from "solid-js"
import { createSimpleContext } from "./helper"

export type FocusContext = "log" | "bookmarks" | "diff"

const FOCUS_ORDER: FocusContext[] = ["log", "bookmarks", "diff"]

export const { use: useFocus, provider: FocusProvider } = createSimpleContext({
	name: "Focus",
	init: () => {
		const [current, setCurrent] = createSignal<FocusContext>("log")

		const cycleNext = () => {
			setCurrent((c) => {
				const idx = FOCUS_ORDER.indexOf(c)
				return FOCUS_ORDER[(idx + 1) % FOCUS_ORDER.length] ?? "log"
			})
		}

		const cyclePrev = () => {
			setCurrent((c) => {
				const idx = FOCUS_ORDER.indexOf(c)
				return (
					FOCUS_ORDER[(idx - 1 + FOCUS_ORDER.length) % FOCUS_ORDER.length] ??
					"log"
				)
			})
		}

		return {
			current,
			set: setCurrent,
			cycleNext,
			cyclePrev,
			is: (ctx: FocusContext) => current() === ctx,
		}
	},
})
