import { execute } from "./executor"

export interface FetchDiffOptions {
	cwd?: string
	columns?: number
}

export async function fetchDiff(
	changeId: string,
	options: FetchDiffOptions = {},
): Promise<string> {
	const env: Record<string, string> = {}

	// Pass COLUMNS to difft/delta for proper side-by-side width
	if (options.columns) {
		env.COLUMNS = String(options.columns)
	}

	const result = await execute(
		["diff", "-r", changeId, "--color", "always", "--ignore-working-copy"],
		{ cwd: options.cwd, env },
	)

	if (!result.success) {
		throw new Error(`jj diff failed: ${result.stderr}`)
	}

	return result.stdout
}
