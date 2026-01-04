export interface Commit {
	changeId: string
	commitId: string
	description: string
	author: string
	authorEmail: string
	timestamp: string
	lines: string[]
	isWorkingCopy: boolean
	immutable: boolean
	empty: boolean
	divergent: boolean
}

export function getRevisionId(commit: Commit): string {
	return commit.divergent ? commit.commitId : commit.changeId
}

export type FileStatus = "added" | "modified" | "deleted" | "renamed" | "copied"

export interface FileChange {
	path: string
	status: FileStatus
	/** Original path for renamed/copied files */
	oldPath?: string
}
