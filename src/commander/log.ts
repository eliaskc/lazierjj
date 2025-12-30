import { execute } from "./executor"
import type { Commit } from "./types"

const MARKER = "__LJ__"

// Strip ANSI escape codes from a string (for extracting clean metadata)
const stripAnsi = (str: string) => str.replace(/\x1b\[[0-9;]*m/g, "")

function buildTemplate(): string {
	const prefix = [
		`"${MARKER}"`,
		"change_id.short()",
		`"${MARKER}"`,
		"commit_id.short()",
		`"${MARKER}"`,
		"immutable",
		`"${MARKER}"`,
	].join(" ++ ")

	return `${prefix} ++ builtin_log_compact`
}

export function parseLogOutput(output: string): Commit[] {
	const commits: Commit[] = []
	let current: Commit | null = null

	for (const line of output.split("\n")) {
		if (line.includes(MARKER)) {
			const parts = line.split(MARKER)
			if (parts.length >= 5) {
				if (current) {
					commits.push(current)
				}

				const gutter = parts[0] ?? ""
				current = {
					changeId: stripAnsi(parts[1] ?? ""),
					commitId: stripAnsi(parts[2] ?? ""),
					immutable: stripAnsi(parts[3] ?? "") === "true",
					isWorkingCopy: gutter.includes("@"),
					lines: [gutter + (parts[4] ?? "")],
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
	const result = await execute(
		["log", "--color", "always", "--template", template],
		{
			cwd,
		},
	)

	if (!result.success) {
		throw new Error(`jj log failed: ${result.stderr}`)
	}

	return parseLogOutput(result.stdout)
}
