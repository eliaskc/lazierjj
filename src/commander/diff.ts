import { execute } from "./executor"

function stripAnsi(str: string): string {
	return str.replace(/\x1b\[[0-9;]*m/g, "")
}

export async function fetchDiff(changeId: string, cwd?: string): Promise<string> {
	const result = await execute(["diff", "-r", changeId], {
		cwd,
	})

	if (!result.success) {
		throw new Error(`jj diff failed: ${result.stderr}`)
	}

	return stripAnsi(result.stdout)
}
