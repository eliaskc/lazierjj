import type { Hunk } from "../diff/parser"
import type { DiffFile } from "../diff/parser"
import type { CommentAnchor, HunkComments, RevisionComments } from "./types"

export interface HunkIndexEntry {
	id: string
	filePath: string
	oldStart: number
	oldCount: number
	newStart: number
	newCount: number
	contextLines: string[]
	hunk: Hunk
}

export function getContextLines(hunk: Hunk, maxLines = 5): string[] {
	const lines: string[] = []
	for (const content of hunk.hunkContent) {
		if (content.type !== "context") continue
		for (const line of content.lines) {
			if (lines.length >= maxLines) return lines
			lines.push(line.trim())
		}
	}
	return lines
}

export function buildAnchor(filePath: string, hunk: Hunk): CommentAnchor {
	return {
		filePath,
		lineRange: {
			oldStart: hunk.deletionStart,
			oldCount: hunk.deletionLines,
			newStart: hunk.additionStart,
			newCount: hunk.additionLines,
		},
		contextLines: getContextLines(hunk),
	}
}

export function buildHunkIndex(files: DiffFile[]): HunkIndexEntry[] {
	let counter = 0
	const entries: HunkIndexEntry[] = []

	for (const file of files) {
		for (const hunk of file.hunks) {
			counter += 1
			entries.push({
				id: `h${counter}`,
				filePath: file.name,
				oldStart: hunk.deletionStart,
				oldCount: hunk.deletionLines,
				newStart: hunk.additionStart,
				newCount: hunk.additionLines,
				contextLines: getContextLines(hunk),
				hunk,
			})
		}
	}

	return entries
}

function overlapScore(a: string[], b: string[]): number {
	if (a.length === 0 || b.length === 0) return 0
	const aSet = new Set(a)
	let overlap = 0
	for (const line of b) {
		if (aSet.has(line)) overlap += 1
	}
	return overlap / Math.max(a.length, b.length)
}

function lineScore(anchor: CommentAnchor, candidate: HunkIndexEntry): number {
	const anchorStart =
		anchor.lineRange.newCount > 0
			? anchor.lineRange.newStart
			: anchor.lineRange.oldStart
	const candidateStart =
		candidate.newCount > 0 ? candidate.newStart : candidate.oldStart
	const delta = Math.abs(anchorStart - candidateStart)
	return 1 - Math.min(delta / 50, 1)
}

function matchScore(anchor: CommentAnchor, candidate: HunkIndexEntry): number {
	if (anchor.contextLines.length === 0 || candidate.contextLines.length === 0) {
		return lineScore(anchor, candidate)
	}
	const context = overlapScore(anchor.contextLines, candidate.contextLines)
	const lines = lineScore(anchor, candidate)
	return context * 0.7 + lines * 0.3
}

export function relocateRevision(
	revision: RevisionComments,
	files: DiffFile[],
): { updated: RevisionComments; changed: boolean } {
	const entries = buildHunkIndex(files)
	const byFile = new Map<string, HunkIndexEntry[]>()
	for (const entry of entries) {
		const list = byFile.get(entry.filePath)
		if (list) {
			list.push(entry)
		} else {
			byFile.set(entry.filePath, [entry])
		}
	}

	const used = new Set<string>()
	const nextHunks: Record<string, HunkComments> = {}
	let changed = false

	for (const [hunkId, hunkData] of Object.entries(revision.hunks)) {
		const candidates = byFile.get(hunkData.anchor.filePath) ?? []
		let best: HunkIndexEntry | null = null
		let bestScore = -1

		for (const candidate of candidates) {
			if (used.has(candidate.id)) continue
			const score = matchScore(hunkData.anchor, candidate)
			if (score > bestScore) {
				bestScore = score
				best = candidate
			}
		}

		if (best && bestScore >= 0.4) {
			used.add(best.id)
			const updatedAnchor: CommentAnchor = {
				filePath: best.filePath,
				lineRange: {
					oldStart: best.oldStart,
					oldCount: best.oldCount,
					newStart: best.newStart,
					newCount: best.newCount,
				},
				contextLines: best.contextLines,
			}

			nextHunks[best.id] = {
				...hunkData,
				anchor: updatedAnchor,
				stale: false,
			}

			if (best.id !== hunkId || hunkData.stale) {
				changed = true
			}
			continue
		}

		nextHunks[hunkId] = {
			...hunkData,
			stale: true,
		}
		if (!hunkData.stale) {
			changed = true
		}
	}

	return {
		updated: {
			...revision,
			hunks: nextHunks,
		},
		changed,
	}
}
