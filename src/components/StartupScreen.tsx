import { type ScrollBoxRenderable, TextAttributes } from "@opentui/core"
import { useKeyboard, useRenderer } from "@opentui/solid"
import {
	For,
	Show,
	createEffect,
	createSignal,
	onCleanup,
	onMount,
} from "solid-js"
import { useTheme } from "../context/theme"
import { createDoubleClickDetector } from "../utils/double-click"
import type { RecentRepo } from "../utils/state"
import { formatRelativeTime } from "../utils/state"
import { FooterHints } from "./FooterHints"
import { WaveBackground } from "./WaveBackground"

interface GitRepoScreenProps {
	onInit: (colocate: boolean) => void
	onQuit: () => void
}

function GitRepoScreen(props: GitRepoScreenProps) {
	const { colors } = useTheme()
	const options = [
		{ label: "jj git init", colocate: false },
		{ label: "jj git init --colocate", colocate: true },
	]
	const [selectedIndex, setSelectedIndex] = createSignal(0)

	useKeyboard((evt) => {
		if (evt.name === "j" || evt.name === "down") {
			evt.preventDefault()
			evt.stopPropagation()
			setSelectedIndex((i) => Math.min(options.length - 1, i + 1))
		} else if (evt.name === "k" || evt.name === "up") {
			evt.preventDefault()
			evt.stopPropagation()
			setSelectedIndex((i) => Math.max(0, i - 1))
		} else if (evt.name === "return" || evt.name === "enter") {
			evt.preventDefault()
			evt.stopPropagation()
			const option = options[selectedIndex()]
			if (option) props.onInit(option.colocate)
		} else if (evt.name === "q") {
			evt.preventDefault()
			evt.stopPropagation()
			props.onQuit()
		}
	})

	return (
		<box
			position="absolute"
			left={0}
			top={0}
			width="100%"
			height="100%"
			flexGrow={1}
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
		>
			<box
				flexDirection="column"
				backgroundColor={colors().background}
				width={70}
				paddingLeft={2}
				paddingRight={2}
				paddingTop={1}
				paddingBottom={1}
				gap={1}
			>
				<text fg={colors().text} attributes={TextAttributes.BOLD}>
					Setup
				</text>
				<box flexDirection="column">
					<text fg={colors().warning}>Not a jj repository</text>
					<text fg={colors().textMuted}>
						Git repository detected in this directory
					</text>
				</box>
				<box flexDirection="column">
					<For each={options}>
						{(option, index) => {
							const isSelected = () => index() === selectedIndex()
							const handleDoubleClick = createDoubleClickDetector(() =>
								props.onInit(option.colocate),
							)
							return (
								<box
									backgroundColor={
										isSelected() ? colors().selectionBackground : undefined
									}
									onMouseDown={() => {
										setSelectedIndex(index())
										handleDoubleClick()
									}}
								>
									<text>
										<span
											style={{
												fg: isSelected()
													? colors().primary
													: colors().textMuted,
											}}
										>
											{option.label}
										</span>
									</text>
								</box>
							)
						}}
					</For>
				</box>
				<text fg={colors().textMuted}>
					Tip: --colocate keeps .git as the source of truth
				</text>
				<FooterHints
					hints={[
						{ key: "enter", label: "run" },
						{ key: "q", label: "quit" },
					]}
				/>
			</box>
		</box>
	)
}

interface NoVcsScreenProps {
	recentRepos: RecentRepo[]
	onSelectRepo: (path: string) => void
	onInit: () => void
	onQuit: () => void
}

function NoVcsScreen(props: NoVcsScreenProps) {
	const { colors } = useTheme()
	type FocusedSection = "repos" | "init"
	const [focusedSection, setFocusedSection] = createSignal<FocusedSection>(
		props.recentRepos.length > 0 ? "repos" : "init",
	)
	const [selectedRepoIndex, setSelectedRepoIndex] = createSignal(0)

	// Scrolling for recent repos list
	let scrollRef: ScrollBoxRenderable | undefined
	const [scrollTop, setScrollTop] = createSignal(0)

	const scrollToIndex = (index: number) => {
		if (!scrollRef || props.recentRepos.length === 0) return

		const margin = 1
		const refAny = scrollRef as unknown as Record<string, unknown>
		const viewportHeight =
			(typeof refAny.height === "number" ? refAny.height : null) ??
			(typeof refAny.rows === "number" ? refAny.rows : null) ??
			8
		const currentScrollTop = scrollTop()

		const visibleStart = currentScrollTop
		const visibleEnd = currentScrollTop + viewportHeight - 1
		const safeStart = visibleStart + margin
		const safeEnd = visibleEnd - margin

		let newScrollTop = currentScrollTop
		if (index < safeStart) {
			newScrollTop = Math.max(0, index - margin)
		} else if (index > safeEnd) {
			newScrollTop = Math.max(0, index - viewportHeight + margin + 1)
		}

		if (newScrollTop !== currentScrollTop) {
			scrollRef.scrollTo(newScrollTop)
			setScrollTop(newScrollTop)
		}
	}

	createEffect(() => {
		scrollToIndex(selectedRepoIndex())
	})

	// Trigger re-render of timestamps every 30 seconds
	const [timestampTick, setTimestampTick] = createSignal(0)
	onMount(() => {
		const interval = setInterval(() => setTimestampTick((t) => t + 1), 30000)
		onCleanup(() => clearInterval(interval))
	})

	// Helper that depends on tick to force re-render
	const getTimestamp = (isoDate: string) => {
		timestampTick() // Read signal to create dependency
		return formatRelativeTime(isoDate)
	}

	useKeyboard((evt) => {
		if (evt.name === "tab") {
			evt.preventDefault()
			evt.stopPropagation()
			setFocusedSection((s) => (s === "repos" ? "init" : "repos"))
		} else if (evt.name === "j" || evt.name === "down") {
			evt.preventDefault()
			evt.stopPropagation()
			if (focusedSection() === "repos") {
				setSelectedRepoIndex((i) =>
					Math.min(props.recentRepos.length - 1, i + 1),
				)
			}
		} else if (evt.name === "k" || evt.name === "up") {
			evt.preventDefault()
			evt.stopPropagation()
			if (focusedSection() === "repos") {
				setSelectedRepoIndex((i) => Math.max(0, i - 1))
			}
		} else if (evt.name === "return" || evt.name === "enter") {
			evt.preventDefault()
			evt.stopPropagation()
			if (focusedSection() === "repos") {
				const repo = props.recentRepos[selectedRepoIndex()]
				if (repo) props.onSelectRepo(repo.path)
			} else {
				props.onInit()
			}
		} else if (evt.name === "q") {
			evt.preventDefault()
			evt.stopPropagation()
			props.onQuit()
		} else if (evt.name && /^[1-9]$/.test(evt.name)) {
			evt.preventDefault()
			evt.stopPropagation()
			const index = Number.parseInt(evt.name, 10) - 1
			const repo = props.recentRepos[index]
			if (repo) props.onSelectRepo(repo.path)
		}
	})

	const handleInitDoubleClick = createDoubleClickDetector(() => props.onInit())

	return (
		<box
			position="absolute"
			left={0}
			top={0}
			width="100%"
			height="100%"
			flexGrow={1}
			flexDirection="column"
			justifyContent="center"
			alignItems="center"
		>
			<box
				flexDirection="column"
				backgroundColor={colors().background}
				width={70}
				paddingLeft={2}
				paddingRight={2}
				paddingTop={1}
				paddingBottom={1}
				gap={1}
			>
				<text fg={colors().text} attributes={TextAttributes.BOLD}>
					Setup
				</text>
				<box flexDirection="column">
					<text fg={colors().warning}>Not a jj repository</text>
					<text fg={colors().textMuted}>
						No version control found in this directory
					</text>
				</box>
				<Show
					when={props.recentRepos.length > 0}
					fallback={<text fg={colors().textMuted}>No recent repositories</text>}
				>
					<box
						flexDirection="column"
						onMouseDown={() => setFocusedSection("repos")}
					>
						<text fg={colors().textMuted}>Recent repositories:</text>
						<box height={Math.min(props.recentRepos.length, 10)}>
							<scrollbox
								ref={scrollRef}
								flexGrow={1}
								scrollbarOptions={{ visible: false }}
							>
								<For each={props.recentRepos}>
									{(repo, index) => {
										const isSelected = () =>
											focusedSection() === "repos" &&
											index() === selectedRepoIndex()
										const num = index() + 1
										const displayPath = repo.path.replace(
											new RegExp(`^${process.env.HOME}`),
											"~",
										)
										const handleDoubleClick = createDoubleClickDetector(() =>
											props.onSelectRepo(repo.path),
										)
										return (
											<box
												flexDirection="row"
												backgroundColor={
													isSelected()
														? colors().selectionBackground
														: undefined
												}
												onMouseDown={() => {
													setFocusedSection("repos")
													setSelectedRepoIndex(index())
													handleDoubleClick()
												}}
											>
												<text wrapMode="none">
													<span
														style={{
															fg: isSelected()
																? colors().primary
																: colors().textMuted,
														}}
													>
														{num}.{" "}
													</span>
													<span
														style={{
															fg: isSelected()
																? colors().text
																: colors().textMuted,
														}}
													>
														{displayPath}
													</span>
												</text>
												<box flexGrow={1} />
												<text fg={colors().textMuted}>
													{getTimestamp(repo.lastOpened)}
												</text>
											</box>
										)
									}}
								</For>
							</scrollbox>
						</box>
					</box>
				</Show>
				<box
					backgroundColor={
						focusedSection() === "init"
							? colors().selectionBackground
							: undefined
					}
					onMouseDown={() => {
						setFocusedSection("init")
						handleInitDoubleClick()
					}}
				>
					<text>
						<span
							style={{
								fg:
									focusedSection() === "init"
										? colors().primary
										: colors().textMuted,
							}}
						>
							jj init
						</span>
					</text>
				</box>
				<FooterHints
					hints={[
						{ key: "enter", label: "run" },
						{ key: "q", label: "quit" },
					]}
				/>
			</box>
		</box>
	)
}

export interface StartupScreenProps {
	hasGitRepo: boolean
	recentRepos: RecentRepo[]
	onSelectRepo: (path: string) => void
	onInitJj: () => void
	onInitJjGit: (colocate: boolean) => void
	onQuit: () => void
}

export function StartupScreen(props: StartupScreenProps) {
	return (
		<box flexGrow={1} width="100%" height="100%">
			{/* Wave background renders first (below content) */}
			<WaveBackground />
			{/* Content renders on top */}
			<Show
				when={props.hasGitRepo}
				fallback={
					<NoVcsScreen
						recentRepos={props.recentRepos}
						onSelectRepo={props.onSelectRepo}
						onInit={props.onInitJj}
						onQuit={props.onQuit}
					/>
				}
			>
				<GitRepoScreen onInit={props.onInitJjGit} onQuit={props.onQuit} />
			</Show>
		</box>
	)
}
