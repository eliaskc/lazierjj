import { For, Show, createMemo } from "solid-js"
import {
	flattenDiff,
	getFileStatusColor,
	getFileStatusIndicator,
	type FlattenedFile,
	type FlattenedHunk,
	type DiffLine,
	type FileId,
	type HunkId,
} from "../../diff"
import { useTheme } from "../../context/theme"

interface UnifiedDiffViewProps {
	files: FlattenedFile[]
	activeFileId?: FileId | null
	currentHunkId?: HunkId | null
}

/**
 * Renders a unified diff view (single column with +/- indicators).
 * File-at-a-time: if activeFileId is set, only renders that file.
 */
export function UnifiedDiffView(props: UnifiedDiffViewProps) {
	const { colors } = useTheme()

	const filesToRender = createMemo(() => {
		if (props.activeFileId) {
			const file = props.files.find((f) => f.fileId === props.activeFileId)
			return file ? [file] : []
		}
		return props.files
	})

	return (
		<box flexDirection="column">
			<For each={filesToRender()}>
				{(file) => (
					<FileSection file={file} currentHunkId={props.currentHunkId} />
				)}
			</For>
			<Show when={props.files.length === 0}>
				<text fg={colors().textMuted}>No changes</text>
			</Show>
		</box>
	)
}

interface FileSectionProps {
	file: FlattenedFile
	currentHunkId?: HunkId | null
}

function FileSection(props: FileSectionProps) {
	const { colors } = useTheme()

	return (
		<box flexDirection="column">
			{/* File header */}
			<text wrapMode="none">
				<span style={{ fg: getFileStatusColor(props.file.type) }}>
					{getFileStatusIndicator(props.file.type)}
				</span>{" "}
				<span style={{ fg: colors().text }}>{props.file.name}</span>
				<Show when={props.file.prevName}>
					<span style={{ fg: colors().textMuted }}>
						{" "}
						(from {props.file.prevName})
					</span>
				</Show>
				<span style={{ fg: colors().textMuted }}> | </span>
				<Show when={props.file.additions > 0}>
					<span style={{ fg: colors().success }}>+{props.file.additions}</span>
				</Show>
				<Show when={props.file.additions > 0 && props.file.deletions > 0}>
					<span style={{ fg: colors().textMuted }}> </span>
				</Show>
				<Show when={props.file.deletions > 0}>
					<span style={{ fg: colors().error }}>-{props.file.deletions}</span>
				</Show>
			</text>

			{/* Hunks */}
			<For each={props.file.hunks}>
				{(hunk) => (
					<HunkSection
						hunk={hunk}
						isCurrent={hunk.hunkId === props.currentHunkId}
					/>
				)}
			</For>

			{/* Spacer between files */}
			<text> </text>
		</box>
	)
}

interface HunkSectionProps {
	hunk: FlattenedHunk
	isCurrent: boolean
}

function HunkSection(props: HunkSectionProps) {
	const { colors } = useTheme()

	return (
		<box flexDirection="column">
			{/* Hunk header */}
			<text wrapMode="none">
				<span
					style={{
						fg: props.isCurrent ? colors().info : colors().textMuted,
					}}
				>
					{props.hunk.header}
				</span>
			</text>

			{/* Lines */}
			<For each={props.hunk.lines}>
				{(line) => <DiffLineView line={line} />}
			</For>
		</box>
	)
}

interface DiffLineViewProps {
	line: DiffLine
}

function DiffLineView(props: DiffLineViewProps) {
	const { colors } = useTheme()

	const lineColor = createMemo(() => {
		switch (props.line.type) {
			case "addition":
				return colors().success
			case "deletion":
				return colors().error
			case "hunk-header":
				return colors().info
			default:
				return colors().text
		}
	})

	const prefix = createMemo(() => {
		switch (props.line.type) {
			case "addition":
				return "+"
			case "deletion":
				return "-"
			default:
				return " "
		}
	})

	// Format line numbers: old and new columns
	const lineNum = createMemo(() => {
		const old = props.line.oldLineNumber?.toString().padStart(4, " ") ?? "    "
		const newNum =
			props.line.newLineNumber?.toString().padStart(4, " ") ?? "    "
		return `${old} ${newNum}`
	})

	return (
		<text wrapMode="none">
			<span style={{ fg: colors().textMuted }}>{lineNum()}</span>
			<span style={{ fg: lineColor() }}>
				{prefix()}
				{props.line.content}
			</span>
		</text>
	)
}
