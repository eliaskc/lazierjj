import { For, Show, createMemo } from "solid-js"
import { useTheme } from "../../context/theme"
import type {
	DiffLine,
	FileId,
	FlattenedFile,
	FlattenedHunk,
	HunkId,
	SyntaxToken,
} from "../../diff"
import {
	getFileStatusColor,
	getFileStatusIndicator,
	getLanguage,
	tokenizeLineSync,
} from "../../diff"

// Subtle background colors for diff lines
const DIFF_BG = {
	addition: "#132a13",
	deletion: "#2d1515",
	empty: "#1a1a1a",
	hunkHeader: "#1a1a2e",
} as const

const LINE_NUM_WIDTH = 5

interface SplitDiffViewProps {
	files: FlattenedFile[]
	activeFileId?: FileId | null
	currentHunkId?: HunkId | null
	width: number
}

/**
 * Renders a split (side-by-side) diff view.
 * Shows old version on left, new version on right.
 */
export function SplitDiffView(props: SplitDiffViewProps) {
	const { colors } = useTheme()

	const filesToRender = createMemo(() => {
		if (props.activeFileId) {
			const file = props.files.find((f) => f.fileId === props.activeFileId)
			return file ? [file] : []
		}
		return props.files
	})

	// Calculate column widths
	const columnWidth = createMemo(() => Math.floor((props.width - 3) / 2)) // -3 for separator

	return (
		<box flexDirection="column">
			<For each={filesToRender()}>
				{(file) => (
					<SplitFileSection
						file={file}
						currentHunkId={props.currentHunkId}
						columnWidth={columnWidth()}
					/>
				)}
			</For>
			<Show when={props.files.length === 0}>
				<text fg={colors().textMuted}>No changes</text>
			</Show>
		</box>
	)
}

interface SplitFileSectionProps {
	file: FlattenedFile
	currentHunkId?: HunkId | null
	columnWidth: number
}

function SplitFileSection(props: SplitFileSectionProps) {
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
					<SplitHunkSection
						hunk={hunk}
						isCurrent={hunk.hunkId === props.currentHunkId}
						columnWidth={props.columnWidth}
						filename={props.file.name}
					/>
				)}
			</For>

			<text> </text>
		</box>
	)
}

interface SplitHunkSectionProps {
	hunk: FlattenedHunk
	isCurrent: boolean
	columnWidth: number
	filename: string
}

function SplitHunkSection(props: SplitHunkSectionProps) {
	const { colors } = useTheme()

	const alignedRows = createMemo(() => buildAlignedRows(props.hunk.lines))

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

			<For each={alignedRows()}>
				{(row) => (
					<SplitRowView
						row={row}
						columnWidth={props.columnWidth}
						filename={props.filename}
					/>
				)}
			</For>
		</box>
	)
}

interface AlignedRow {
	left: DiffLine | null // Old side (deletions, context)
	right: DiffLine | null // New side (additions, context)
}

/**
 * Build aligned rows from a list of diff lines.
 * Context lines appear on both sides, deletions on left, additions on right.
 */
function buildAlignedRows(lines: DiffLine[]): AlignedRow[] {
	const rows: AlignedRow[] = []
	let i = 0

	while (i < lines.length) {
		const line = lines[i]

		if (!line) {
			i++
			continue
		}

		if (line.type === "context") {
			// Context appears on both sides
			rows.push({ left: line, right: line })
			i++
		} else if (line.type === "deletion") {
			// Collect consecutive deletions
			const deletions: DiffLine[] = []
			while (i < lines.length && lines[i]?.type === "deletion") {
				const del = lines[i]
				if (del) deletions.push(del)
				i++
			}

			// Collect consecutive additions
			const additions: DiffLine[] = []
			while (i < lines.length && lines[i]?.type === "addition") {
				const add = lines[i]
				if (add) additions.push(add)
				i++
			}

			// Pair them up
			const maxLen = Math.max(deletions.length, additions.length)
			for (let j = 0; j < maxLen; j++) {
				rows.push({
					left: deletions[j] ?? null,
					right: additions[j] ?? null,
				})
			}
		} else if (line.type === "addition") {
			// Addition without preceding deletion
			rows.push({ left: null, right: line })
			i++
		} else {
			i++
		}
	}

	return rows
}

interface SplitRowViewProps {
	row: AlignedRow
	columnWidth: number
	filename: string
}

function SplitRowView(props: SplitRowViewProps) {
	const { colors } = useTheme()

	const contentWidth = createMemo(() => props.columnWidth - LINE_NUM_WIDTH - 3)
	const language = createMemo(() => getLanguage(props.filename))

	const formatLineNum = (num: number | undefined) =>
		(num?.toString() ?? "").padStart(LINE_NUM_WIDTH, " ")

	const tokenizeContent = (
		line: DiffLine | null,
		maxWidth: number,
		fallbackColor: string,
	): SyntaxToken[] => {
		if (!line) return []

		const content = line.content
		const tokens = tokenizeLineSync(content, language())

		let currentLen = 0
		const result: SyntaxToken[] = []

		for (const token of tokens) {
			if (currentLen >= maxWidth) break

			const remaining = maxWidth - currentLen
			if (token.content.length <= remaining) {
				result.push({
					content: token.content,
					color: token.color ?? fallbackColor,
				})
				currentLen += token.content.length
			} else {
				result.push({
					content: `${token.content.slice(0, remaining - 1)}…`,
					color: token.color ?? fallbackColor,
				})
				break
			}
		}

		return result
	}

	const leftBg = createMemo(() => {
		if (!props.row.left) return DIFF_BG.empty
		return props.row.left.type === "deletion" ? DIFF_BG.deletion : undefined
	})

	const rightBg = createMemo(() => {
		if (!props.row.right) return DIFF_BG.empty
		return props.row.right.type === "addition" ? DIFF_BG.addition : undefined
	})

	const leftTokens = createMemo(() =>
		tokenizeContent(props.row.left, contentWidth(), colors().text),
	)

	const rightTokens = createMemo(() =>
		tokenizeContent(props.row.right, contentWidth(), colors().text),
	)

	return (
		<box flexDirection="row">
			<box backgroundColor={leftBg()} flexGrow={1} flexBasis={0}>
				<text wrapMode="none">
					<span style={{ fg: colors().textMuted }}>
						{formatLineNum(props.row.left?.oldLineNumber)}
					</span>
					<span style={{ fg: colors().textMuted }}> │ </span>
					<For each={leftTokens()}>
						{(token) => (
							<span style={{ fg: token.color }}>{token.content}</span>
						)}
					</For>
				</text>
			</box>
			<text fg={colors().border}>│</text>
			<box backgroundColor={rightBg()} flexGrow={1} flexBasis={0}>
				<text wrapMode="none">
					<span style={{ fg: colors().textMuted }}>
						{formatLineNum(props.row.right?.newLineNumber)}
					</span>
					<span style={{ fg: colors().textMuted }}> │ </span>
					<For each={rightTokens()}>
						{(token) => (
							<span style={{ fg: token.color }}>{token.content}</span>
						)}
					</For>
				</text>
			</box>
		</box>
	)
}
