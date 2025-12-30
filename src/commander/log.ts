import { executeWithColor } from "./executor"
import type { Commit } from "./types"

const MARKER = "__LJ__"

function buildTemplate(): string {
	const prefix = [
		`"${MARKER}"`,
		"change_id.short()",
		`"${MARKER}"`,
		"commit_id.short()",
		`"${MARKER}"`,
		"immutable",
		`"${MARKER}"`,
		'if(self.working_copies(), "@")',
		`"${MARKER}"`,
	].join(" ++ ")

	return `${prefix} ++ builtin_log_compact`
}

export function parseLogOutput(output: string): Commit[] {
	const commits: Commit[] = []
	let current: Commit | null = null

	for (const line of output.split("\n")) {
		if (line.startsWith(MARKER)) {
			const parts = line.split(MARKER)
			// parts: ["", changeId, commitId, immutable, workingCopy, displayContent]
			if (parts.length >= 6) {
				if (current) {
					commits.push(current)
				}

				current = {
					changeId: parts[1] ?? "",
					commitId: parts[2] ?? "",
					immutable: parts[3] === "true",
					isWorkingCopy: parts[4] === "@",
					lines: [parts[5] ?? ""],
				}
				continue
			}
		}

		if (current && line.trim() !== "") {
			current.lines.push(line)
		}
	}

	if (current) {
		commits.push(current)
	}

	return commits
}

export async function fetchLog(cwd?: string): Promise<Commit[]> {
	const template = buildTemplate()
	const result = await executeWithColor(["log", "--template", template], {
		cwd,
	})

	if (!result.success) {
		throw new Error(`jj log failed: ${result.stderr}`)
	}

	return parseLogOutput(result.stdout)
}
