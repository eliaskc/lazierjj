import { For, Show, createMemo } from "solid-js"
import type {
	FlattenedFile,
	FlattenedHunk,
	DiffLine,
	FileId,
	HunkId,
} from "../../diff"
import { useTheme } from "../../context/theme"

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
			{/* File header - spans both columns */}
			<text wrapMode="none">
				<span style={{ fg: colors().info }}>{props.file.name}</span>
			</text>

			{/* Column headers */}
			<box flexDirection="row">
				<text wrapMode="none">
					<span style={{ fg: colors().textMuted }}>
						{"─".repeat(Math.min(props.columnWidth, 40))} Old
					</span>
				</text>
				<text fg={colors().textMuted}> │ </text>
				<text wrapMode="none">
					<span style={{ fg: colors().textMuted }}>
						New {"─".repeat(Math.min(props.columnWidth - 4, 36))}
					</span>
				</text>
			</box>

			{/* Hunks */}
			<For each={props.file.hunks}>
				{(hunk) => (
					<SplitHunkSection
						hunk={hunk}
						isCurrent={hunk.hunkId === props.currentHunkId}
						columnWidth={props.columnWidth}
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
}

function SplitHunkSection(props: SplitHunkSectionProps) {
	const { colors } = useTheme()

	// Build aligned rows for split view
	const alignedRows = createMemo(() => {
		return buildAlignedRows(props.hunk.lines)
	})

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

			{/* Aligned rows */}
			<For each={alignedRows()}>
				{(row) => <SplitRowView row={row} columnWidth={props.columnWidth} />}
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
}

function SplitRowView(props: SplitRowViewProps) {
	const { colors } = useTheme()

	const formatCell = (line: DiffLine | null, side: "left" | "right") => {
		if (!line) {
			return " ".repeat(Math.min(props.columnWidth, 60))
		}

		const lineNum =
			side === "left"
				? (line.oldLineNumber?.toString().padStart(4, " ") ?? "    ")
				: (line.newLineNumber?.toString().padStart(4, " ") ?? "    ")

		const prefix =
			line.type === "context" ? " " : line.type === "deletion" ? "-" : "+"
		const content = `${lineNum} ${prefix}${line.content}`

		// Truncate to column width
		if (content.length > props.columnWidth) {
			return `${content.slice(0, props.columnWidth - 1)}…`
		}
		return content.padEnd(props.columnWidth)
	}

	const leftColor = () => {
		if (!props.row.left) return colors().textMuted
		return props.row.left.type === "deletion" ? colors().error : colors().text
	}

	const rightColor = () => {
		if (!props.row.right) return colors().textMuted
		return props.row.right.type === "addition"
			? colors().success
			: colors().text
	}

	return (
		<box flexDirection="row">
			<text wrapMode="none">
				<span style={{ fg: leftColor() }}>
					{formatCell(props.row.left, "left")}
				</span>
			</text>
			<text fg={colors().textMuted}> │ </text>
			<text wrapMode="none">
				<span style={{ fg: rightColor() }}>
					{formatCell(props.row.right, "right")}
				</span>
			</text>
		</box>
	)
}
