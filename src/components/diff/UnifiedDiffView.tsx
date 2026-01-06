import { For, Show, createMemo } from "solid-js"
import { useTheme } from "../../context/theme"
import {
	type DiffLine,
	type FileId,
	type FlattenedFile,
	type FlattenedHunk,
	type HunkId,
	flattenDiff,
	getFileStatusColor,
	getFileStatusIndicator,
} from "../../diff"

// Subtle background colors for diff lines
const DIFF_BG = {
	addition: "#132a13",
	deletion: "#2d1515",
	hunkHeader: "#1a1a2e",
} as const

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
			<box
				backgroundColor={colors().backgroundElement}
				paddingLeft={1}
				paddingRight={1}
			>
				<text wrapMode="none">
					<span style={{ fg: getFileStatusColor(props.file.type) }}>
						{getFileStatusIndicator(props.file.type)}
					</span>{" "}
					<span style={{ fg: colors().text }}>{props.file.name}</span>
					<Show when={props.file.prevName}>
						<span style={{ fg: colors().textMuted }}>
							{" "}
							← {props.file.prevName}
						</span>
					</Show>
					<span style={{ fg: colors().textMuted }}> │ </span>
					<Show when={props.file.additions > 0}>
						<span style={{ fg: colors().success }}>
							+{props.file.additions}
						</span>
					</Show>
					<Show when={props.file.additions > 0 && props.file.deletions > 0}>
						<span style={{ fg: colors().textMuted }}> </span>
					</Show>
					<Show when={props.file.deletions > 0}>
						<span style={{ fg: colors().error }}>-{props.file.deletions}</span>
					</Show>
				</text>
			</box>

			<For each={props.file.hunks}>
				{(hunk) => (
					<HunkSection
						hunk={hunk}
						isCurrent={hunk.hunkId === props.currentHunkId}
					/>
				)}
			</For>

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
			<box backgroundColor={DIFF_BG.hunkHeader} paddingLeft={1}>
				<text wrapMode="none">
					<span
						style={{
							fg: props.isCurrent ? colors().info : colors().textMuted,
						}}
					>
						{props.hunk.header}
					</span>
				</text>
			</box>

			<For each={props.hunk.lines}>
				{(line) => <DiffLineView line={line} />}
			</For>
		</box>
	)
}

interface DiffLineViewProps {
	line: DiffLine
}

const LINE_NUM_WIDTH = 5

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

	const lineBg = createMemo(() => {
		switch (props.line.type) {
			case "addition":
				return DIFF_BG.addition
			case "deletion":
				return DIFF_BG.deletion
			default:
				return undefined
		}
	})

	const oldLineNum = createMemo(() =>
		(props.line.oldLineNumber?.toString() ?? "").padStart(LINE_NUM_WIDTH, " "),
	)

	const newLineNum = createMemo(() =>
		(props.line.newLineNumber?.toString() ?? "").padStart(LINE_NUM_WIDTH, " "),
	)

	return (
		<box flexDirection="row" backgroundColor={lineBg()}>
			<text wrapMode="none">
				<span style={{ fg: colors().textMuted }}>{oldLineNum()}</span>
				<span style={{ fg: colors().textMuted }}> {newLineNum()}</span>
				<span style={{ fg: colors().textMuted }}> │ </span>
				<span style={{ fg: lineColor() }}>{props.line.content}</span>
			</text>
		</box>
	)
}
