import { useKeyboard, useRenderer } from "@opentui/solid"
import { onMount } from "solid-js"
import { Layout } from "./components/Layout"
import { LogPanel } from "./components/panels/LogPanel"
import { MainArea } from "./components/panels/MainArea"
import { SyncProvider, useSync } from "./context/sync"

function AppContent() {
	const renderer = useRenderer()
	const { selectPrev, selectNext, selectFirst, selectLast, loadLog } = useSync()

	onMount(() => {
		loadLog()
	})

	useKeyboard((evt) => {
		switch (evt.name) {
			case "q":
				renderer.destroy()
				process.exit(0)
				break
			case "j":
			case "down":
				selectNext()
				break
			case "k":
			case "up":
				selectPrev()
				break
			case "g":
				selectFirst()
				break
			case "G":
				selectLast()
				break
		}
	})

	return <Layout left={<LogPanel />} right={<MainArea />} />
}

export function App() {
	return (
		<SyncProvider>
			<AppContent />
		</SyncProvider>
	)
}
