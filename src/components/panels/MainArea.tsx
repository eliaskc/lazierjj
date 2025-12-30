import { Show } from "solid-js"
import { useSync } from "../../context/sync"

export function MainArea() {
	const { selectedCommit, diff, diffLoading, diffError } = useSync()

	const headerText = () => {
		const commit = selectedCommit()
		if (!commit) return ""
		const desc = commit.lines[1] ?? ""
		return `Change: ${commit.changeId}\nCommit: ${commit.commitId}\n${desc}\n────────────────────────────────────`
	}

	return (
		<box flexDirection="column" flexGrow={1} height="100%">
			<Show when={selectedCommit()}>
				<text>{headerText()}</text>
			</Show>
			<Show when={diffLoading()}>
				<text>Loading diff...</text>
			</Show>
			<Show when={diffError()}>
				<text>Error: {diffError()}</text>
			</Show>
			<Show when={!diffLoading() && !diffError() && diff()}>
				<text>{diff()}</text>
			</Show>
			<Show when={!diffLoading() && !diffError() && !diff()}>
				<text>No changes in this commit</text>
			</Show>
		</box>
	)
}
