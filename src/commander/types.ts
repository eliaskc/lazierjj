export interface Commit {
	changeId: string
	commitId: string
	lines: string[]
	isWorkingCopy: boolean
	immutable: boolean
}
