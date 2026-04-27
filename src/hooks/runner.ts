import { existsSync, realpathSync } from "node:fs"
import { homedir } from "node:os"
import { isAbsolute, resolve } from "node:path"
import type { ExecuteResult } from "../commander/executor"
import { readConfig } from "../config"
import { getRepoPath } from "../repo"

export interface HookRunOptions {
	verify?: boolean
}

export class HookError extends Error {
	constructor(
		message: string,
		readonly command: string,
		readonly result: ExecuteResult,
	) {
		super(message)
		this.name = "HookError"
	}
}

function expandHome(path: string): string {
	if (path === "~") return homedir()
	if (path.startsWith("~/")) return resolve(homedir(), path.slice(2))
	return path
}

function resolvePath(path: string, base = getRepoPath()): string {
	const expanded = expandHome(path)
	return isAbsolute(expanded) ? expanded : resolve(base, expanded)
}

function canonicalPath(path: string): string {
	const resolved = resolvePath(path)
	return existsSync(resolved) ? realpathSync(resolved) : resolved
}

function isPathWithin(path: string, parent: string): boolean {
	return path === parent || path.startsWith(`${parent}/`)
}

function commandText(command: string | { command: string }): string {
	return typeof command === "string" ? command : command.command
}

export async function runPreHooks(
	operationId: string,
	options: HookRunOptions = {},
): Promise<ExecuteResult[]> {
	if (options.verify === false) return []

	const hook = readConfig().hooks[operationId]
	if (!hook || hook.pre.length === 0) return []

	if (hook.onlyIn) {
		const repoPath = canonicalPath(getRepoPath())
		const onlyInPath = canonicalPath(hook.onlyIn)
		if (!isPathWithin(repoPath, onlyInPath)) return []
	}

	const results: ExecuteResult[] = []
	for (const hookCommand of hook.pre) {
		const command = commandText(hookCommand)
		const env = typeof hookCommand === "string" ? undefined : hookCommand.env

		const proc = Bun.spawn(["sh", "-lc", command], {
			cwd: getRepoPath(),
			env: {
				...process.env,
				...env,
			},
			stdin: "ignore",
			stdout: "pipe",
			stderr: "pipe",
		})

		const [stdout, stderr] = await Promise.all([
			new Response(proc.stdout).text(),
			new Response(proc.stderr).text(),
		])
		const exitCode = await proc.exited
		const result = {
			stdout,
			stderr,
			exitCode,
			success: exitCode === 0,
		}
		results.push(result)

		if (!result.success) {
			throw new HookError(
				`Hook for ${operationId} failed with exit code ${exitCode}: ${command}`,
				command,
				result,
			)
		}
	}

	return results
}
