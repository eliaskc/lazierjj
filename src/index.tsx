import { existsSync } from "node:fs"
import { resolve } from "node:path"

const CLI_COMMANDS = ["changes", "comment", "help"]
const CLI_FLAGS = ["--help", "-h", "--version", "-V"]

const args = process.argv.slice(2)
const firstArg = args[0]

if (
	firstArg &&
	(CLI_COMMANDS.includes(firstArg) || CLI_FLAGS.includes(firstArg))
) {
	const { runCli } = await import("./cli/index.js")
	const normalizedArgs = firstArg === "-V" ? ["--version"] : args
	await runCli(normalizedArgs)
	process.exit(0)
}

if (
	firstArg &&
	!firstArg.startsWith("-") &&
	!firstArg.startsWith("/") &&
	!existsSync(resolve(firstArg))
) {
	console.error(`Unknown command: ${firstArg}`)
	console.error("Run 'kajji --help' for available commands")
	process.exit(1)
}

const { runTui } = await import("./tui.js")
await runTui(args)
