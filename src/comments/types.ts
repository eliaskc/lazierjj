export interface CommentLineRange {
	oldStart: number
	oldCount: number
	newStart: number
	newCount: number
}

export interface CommentAnchor {
	filePath: string
	lineRange: CommentLineRange
	contextLines: string[]
}

export interface CommentEntry {
	id: string
	text: string
	author: string
	type: string
	createdAt: string
	replyTo?: string | null
}

export interface HunkComments {
	anchor: CommentAnchor
	comments: CommentEntry[]
	stale?: boolean
}

export interface RevisionComments {
	commitHash: string
	hunks: Record<string, HunkComments>
}

export interface CommentsState {
	version: 1
	revisions: Record<string, RevisionComments>
}
