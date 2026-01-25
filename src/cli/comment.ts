import { defineCommand } from "citty"
import { nanoid } from "nanoid"
import {
	buildAnchor,
	buildHunkIndex,
	relocateRevision,
} from "../comments/relocate"
import {
	readComments,
	resolveRepoRoot,
	writeComments,
} from "../comments/storage"
import type { HunkComments } from "../comments/types"
import { fetchParsedDiff } from "../diff/parser"
import { formatLineRange } from "./format"
import { type RevisionInfo, fetchRevisions } from "./revisions"

async function resolveSingleRevision(revset: string): Promise<RevisionInfo> {
	const revisions = await fetchRevisions(revset)
	if (revisions.length === 0) {
		throw new Error(`No revisions found for revset: ${revset}`)
	}
	if (revisions.length > 1) {
		throw new Error(`Revset '${revset}' resolves to multiple revisions`)
	}
	const revision = revisions[0]
	if (!revision) {
		throw new Error(`No revisions found for revset: ${revset}`)
	}
	return revision
}

export const commentCommand = defineCommand({
	meta: {
		name: "comment",
		description: "Manage comments",
	},
	subCommands: {
		list: defineCommand({
			meta: {
				name: "list",
				description: "List comments",
			},
			args: {
				revisions: {
					alias: "r",
					type: "string",
					default: "@",
					description: "Target revisions to show",
				},
				json: {
					type: "boolean",
					description: "Output JSON",
				},
			},
			async run({ args }) {
				const input = args as { revisions?: string; json?: boolean }
				await listComments({ revisions: input.revisions, json: input.json })
			},
		}),
		set: defineCommand({
			meta: {
				name: "set",
				description: "Add a comment to a hunk",
			},
			args: {
				revisions: {
					alias: "r",
					type: "string",
					default: "@",
					description: "Target revisions",
				},
				hunk: {
					type: "string",
					required: true,
					description: "Hunk ID (h1, h2, ...)",
				},
				message: {
					alias: "m",
					type: "string",
					required: true,
					description: "Comment text",
				},
				author: {
					type: "string",
					default: "human",
					description: "Comment author label",
				},
				explanation: {
					type: "boolean",
					description: "Mark as explanation",
				},
				type: {
					type: "string",
					default: "feedback",
					description: "Comment type",
				},
			},
			async run({ args }) {
				const rev = (args as { revisions?: string }).revisions ?? "@"
				const hunk = (args as { hunk?: string }).hunk
				const message = (args as { message?: string }).message
				const author = (args as { author?: string }).author ?? "human"
				const explanation = Boolean(
					(args as { explanation?: boolean }).explanation,
				)
				const type = (args as { type?: string }).type ?? "feedback"
				if (!hunk || !message) {
					throw new Error("Missing required options: --hunk and --message")
				}
				const revision = await resolveSingleRevision(rev)
				const repoRoot = await resolveRepoRoot()
				const state = readComments(repoRoot)
				const files = await fetchParsedDiff(revision.changeId)
				const hunks = buildHunkIndex(files)
				const target = hunks.find((entry) => entry.id === hunk)
				if (!target) {
					throw new Error(`Hunk not found: ${hunk}`)
				}

				const anchor = buildAnchor(target.filePath, target.hunk)
				const revisionEntry = state.revisions[revision.changeId] ?? {
					commitHash: revision.commitId,
					hunks: {},
				}
				revisionEntry.commitHash = revision.commitId

				const hunkEntry: HunkComments = revisionEntry.hunks[hunk] ?? {
					anchor,
					comments: [],
				}
				hunkEntry.anchor = anchor
				hunkEntry.stale = false
				const commentId = `cmt_${nanoid(8)}`
				const commentType = explanation ? "explanation" : type
				hunkEntry.comments.push({
					id: commentId,
					text: message,
					author,
					type: commentType,
					createdAt: new Date().toISOString(),
					replyTo: null,
				})
				revisionEntry.hunks[hunk] = hunkEntry
				state.revisions[revision.changeId] = revisionEntry
				writeComments(repoRoot, state)
				console.log(`Added comment ${commentId} on ${hunk}`)
			},
		}),
		delete: defineCommand({
			meta: {
				name: "delete",
				description: "Delete comment(s)",
			},
			args: {
				id: {
					type: "positional",
					description: "Comment ID",
					required: false,
				},
				revisions: {
					alias: "r",
					type: "string",
					default: "@",
					description: "Target revisions",
				},
				hunk: {
					type: "string",
					description: "Hunk ID",
				},
			},
			async run({ args }) {
				const repoRoot = await resolveRepoRoot()
				const state = readComments(repoRoot)
				let updated = false

				if (args.id) {
					const id = args.id
					for (const [changeId, revision] of Object.entries(state.revisions)) {
						for (const [hunkId, hunk] of Object.entries(revision.hunks)) {
							const nextComments = hunk.comments.filter(
								(comment) => comment.id !== id,
							)
							if (nextComments.length !== hunk.comments.length) {
								revision.hunks[hunkId] = {
									...hunk,
									comments: nextComments,
								}
								updated = true
							}
							if (revision.hunks[hunkId]?.comments.length === 0) {
								delete revision.hunks[hunkId]
							}
						}
						if (Object.keys(revision.hunks).length === 0) {
							delete state.revisions[changeId]
						}
					}

					if (!updated) {
						throw new Error(`Comment not found: ${id}`)
					}
					writeComments(repoRoot, state)
					console.log(`Deleted comment ${id}`)
					return
				}

				const rev = (args as { revisions?: string }).revisions ?? "@"
				const hunk = (args as { hunk?: string }).hunk
				if (!hunk) {
					throw new Error("Provide a comment ID or --hunk")
				}

				const revision = await resolveSingleRevision(rev)
				const entry = state.revisions[revision.changeId]
				if (!entry || !entry.hunks[hunk]) {
					throw new Error("No comments for that hunk")
				}
				const removedCount = entry.hunks[hunk].comments.length
				delete entry.hunks[hunk]
				updated = true
				if (Object.keys(entry.hunks).length === 0) {
					delete state.revisions[revision.changeId]
				}
				if (updated) {
					writeComments(repoRoot, state)
					console.log(`Deleted ${removedCount} comments from ${hunk}`)
				}
			},
		}),
	},
})

async function listComments(args: {
	revisions?: string
	json?: boolean
}): Promise<void> {
	const repoRoot = await resolveRepoRoot()
	const state = readComments(repoRoot)
	const revisions = await fetchRevisions(args.revisions ?? "@")
	const output: Array<{
		changeId: string
		commitId: string
		description: string
		hunks: Array<{ id: string; data: HunkComments }>
	}> = []

	let mutated = false

	for (const revision of revisions) {
		const stored = state.revisions[revision.changeId]
		if (!stored) continue

		if (stored.commitHash !== revision.commitId) {
			const files = await fetchParsedDiff(revision.changeId)
			const relocation = relocateRevision(stored, files)
			state.revisions[revision.changeId] = {
				...relocation.updated,
				commitHash: revision.commitId,
			}
			mutated = true
		}

		const updated = state.revisions[revision.changeId]
		if (!updated) continue
		const hunks = Object.entries(updated.hunks).map(([id, data]) => ({
			id,
			data,
		}))
		if (hunks.length === 0) continue
		output.push({
			changeId: revision.changeId,
			commitId: revision.commitId,
			description: revision.description,
			hunks,
		})
	}

	if (mutated) {
		writeComments(repoRoot, state)
	}

	if (args.json) {
		const json = {
			revisions: output.map((revision) => ({
				changeId: revision.changeId,
				commitId: revision.commitId,
				description: revision.description,
				hunks: revision.hunks.map((hunk) => ({
					id: hunk.id,
					stale: hunk.data.stale ?? false,
					anchor: hunk.data.anchor,
					comments: hunk.data.comments,
				})),
			})),
		}
		console.log(JSON.stringify(json, null, 2))
		return
	}

	if (output.length === 0) {
		console.log("No comments found")
		return
	}

	for (const revision of output) {
		console.log(`${revision.changeId} - "${revision.description}"`)
		for (const hunk of revision.hunks) {
			const range = formatLineRange(
				hunk.data.anchor.lineRange.oldStart,
				hunk.data.anchor.lineRange.oldCount,
				hunk.data.anchor.lineRange.newStart,
				hunk.data.anchor.lineRange.newCount,
			)
			const staleLabel = hunk.data.stale ? " (stale)" : ""
			console.log(
				`  ${hunk.id}${staleLabel} ${hunk.data.anchor.filePath} lines ${range}`,
			)
			for (const comment of hunk.data.comments) {
				console.log(
					`    ${comment.id} (${comment.author}/${comment.type}) ${comment.text}`,
				)
			}
		}
		if (output.length > 1) {
			console.log("")
		}
	}
}
