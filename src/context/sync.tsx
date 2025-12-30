import { useRenderer } from "@opentui/solid"
import {
	type JSX,
	createContext,
	createEffect,
	createSignal,
	onCleanup,
	onMount,
	useContext,
} from "solid-js"
import { fetchDiff } from "../commander/diff"
import { fetchLog } from "../commander/log"
import type { Commit } from "../commander/types"

interface SyncContextValue {
	commits: () => Commit[]
	selectedIndex: () => number
	setSelectedIndex: (index: number) => void
	selectPrev: () => void
	selectNext: () => void
	selectFirst: () => void
	selectLast: () => void
	selectedCommit: () => Commit | undefined
	loadLog: () => Promise<void>
	loading: () => boolean
	error: () => string | null
	diff: () => string | null
	diffLoading: () => boolean
	diffError: () => string | null
	terminalWidth: () => number
	terminalHeight: () => number
	mainAreaWidth: () => number
}

const SyncContext = createContext<SyncContextValue>()

export function SyncProvider(props: { children: JSX.Element }) {
	const renderer = useRenderer()
	const [commits, setCommits] = createSignal<Commit[]>([])
	const [selectedIndex, setSelectedIndex] = createSignal(0)
	const [loading, setLoading] = createSignal(false)
	const [error, setError] = createSignal<string | null>(null)
	const [diff, setDiff] = createSignal<string | null>(null)
	const [diffLoading, setDiffLoading] = createSignal(false)
	const [diffError, setDiffError] = createSignal<string | null>(null)
	const [terminalWidth, setTerminalWidth] = createSignal(renderer.width)
	const [terminalHeight, setTerminalHeight] = createSignal(renderer.height)

	const mainAreaWidth = () => {
		const width = terminalWidth()
		const mainAreaRatio = 2 / 3
		const borderWidth = 2
		return Math.floor(width * mainAreaRatio) - borderWidth
	}

	onMount(() => {
		const handleResize = (width: number, height: number) => {
			setTerminalWidth(width)
			setTerminalHeight(height)
		}
		renderer.on("resize", handleResize)
		onCleanup(() => renderer.off("resize", handleResize))
	})

	const selectPrev = () => {
		setSelectedIndex((i) => Math.max(0, i - 1))
	}

	const selectNext = () => {
		setSelectedIndex((i) => Math.min(commits().length - 1, i + 1))
	}

	const selectFirst = () => {
		setSelectedIndex(0)
	}

	const selectLast = () => {
		setSelectedIndex(Math.max(0, commits().length - 1))
	}

	const selectedCommit = () => commits()[selectedIndex()]

	let diffDebounceTimer: ReturnType<typeof setTimeout> | null = null
	let currentDiffChangeId: string | null = null

	const loadDiff = async (changeId: string, columns: number) => {
		currentDiffChangeId = changeId
		setDiffLoading(true)
		setDiffError(null)
		try {
			const result = await fetchDiff(changeId, { columns })
			if (currentDiffChangeId === changeId) {
				setDiff(result)
			}
		} catch (e) {
			if (currentDiffChangeId === changeId) {
				setDiffError(e instanceof Error ? e.message : "Failed to load diff")
				setDiff(null)
			}
		} finally {
			if (currentDiffChangeId === changeId) {
				setDiffLoading(false)
			}
		}
	}

	createEffect(() => {
		const commit = selectedCommit()
		const columns = mainAreaWidth()
		if (commit) {
			if (diffDebounceTimer) {
				clearTimeout(diffDebounceTimer)
			}
			diffDebounceTimer = setTimeout(() => {
				loadDiff(commit.changeId, columns)
			}, 100)
		}
	})

	const loadLog = async () => {
		setLoading(true)
		setError(null)
		try {
			const result = await fetchLog()
			setCommits(result)
			setSelectedIndex(0)
		} catch (e) {
			setError(e instanceof Error ? e.message : "Failed to load log")
		} finally {
			setLoading(false)
		}
	}

	const value: SyncContextValue = {
		commits,
		selectedIndex,
		setSelectedIndex,
		selectPrev,
		selectNext,
		selectFirst,
		selectLast,
		selectedCommit,
		loadLog,
		loading,
		error,
		diff,
		diffLoading,
		diffError,
		terminalWidth,
		terminalHeight,
		mainAreaWidth,
	}

	return (
		<SyncContext.Provider value={value}>{props.children}</SyncContext.Provider>
	)
}

export function useSync(): SyncContextValue {
	const ctx = useContext(SyncContext)
	if (!ctx) {
		throw new Error("useSync must be used within SyncProvider")
	}
	return ctx
}
