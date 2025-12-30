import { createSignal } from "solid-js"
import { createSimpleContext } from "./helper"

export type FocusContext = "log" | "diff"

export const { use: useFocus, provider: FocusProvider } = createSimpleContext({
	name: "Focus",
	init: () => {
		const [current, setCurrent] = createSignal<FocusContext>("log")

		return {
			current,
			set: setCurrent,
			toggle: () => setCurrent((c) => (c === "log" ? "diff" : "log")),
			is: (ctx: FocusContext) => current() === ctx,
		}
	},
})
