declare const self: Worker

import {
	type DiffsHighlighter,
	type SupportedLanguages,
	getSharedHighlighter,
} from "@pierre/diffs"

interface TokenizeRequest {
	type: "tokenize"
	id: string
	key: string
	content: string
	language: SupportedLanguages
}

interface InitRequest {
	type: "init"
}

type WorkerRequest = TokenizeRequest | InitRequest

interface SyntaxToken {
	content: string
	color?: string
}

interface TokenizeResponse {
	type: "tokens"
	id: string
	key: string
	tokens: SyntaxToken[]
}

interface ReadyResponse {
	type: "ready"
}

interface ErrorResponse {
	type: "error"
	id?: string
	error: string
}

type WorkerResponse = TokenizeResponse | ReadyResponse | ErrorResponse

const COMMON_LANGS: SupportedLanguages[] = [
	"typescript",
	"tsx",
	"javascript",
	"jsx",
	"json",
	"html",
	"css",
	"markdown",
	"yaml",
	"toml",
	"bash",
	"python",
	"rust",
	"go",
]

const WARMUP_PATTERNS = [
	'const x = { a: 1, b: "test" }',
	'import { foo, bar } from "module"',
	"export function Component(props: Props) {",
	"const [state, setState] = useState<string>()",
	'return <div className="test">{children}</div>',
	"async function fetchData(): Promise<void> {}",
	"interface Props { value: string; onChange: (v: string) => void }",
	"type Result<T> = { data: T; error?: Error }",
]

const WARMUP_LANGS: SupportedLanguages[] = ["typescript", "tsx"]

let highlighter: DiffsHighlighter | null = null

async function initHighlighter(): Promise<void> {
	highlighter = await getSharedHighlighter({
		themes: ["ayu-dark"],
		langs: COMMON_LANGS,
	})

	for (const lang of WARMUP_LANGS) {
		for (const pattern of WARMUP_PATTERNS) {
			highlighter.codeToTokens(pattern, { lang, theme: "ayu-dark" })
		}
	}
}

function tokenize(
	content: string,
	language: SupportedLanguages,
): SyntaxToken[] {
	if (!highlighter) {
		return [{ content }]
	}

	try {
		const loadedLangs = highlighter.getLoadedLanguages()
		if (!loadedLangs.includes(language)) {
			return [{ content }]
		}

		const result = highlighter.codeToTokens(content, {
			lang: language,
			theme: "ayu-dark",
		})

		const tokens: SyntaxToken[] = []
		for (const line of result.tokens) {
			for (const token of line) {
				tokens.push({
					content: token.content,
					color: token.color,
				})
			}
		}

		return tokens
	} catch {
		return [{ content }]
	}
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
	const request = e.data

	if (request.type === "init") {
		try {
			await initHighlighter()
			const response: ReadyResponse = { type: "ready" }
			self.postMessage(response)
		} catch (err) {
			const response: ErrorResponse = {
				type: "error",
				error: err instanceof Error ? err.message : "Failed to initialize",
			}
			self.postMessage(response)
		}
		return
	}

	if (request.type === "tokenize") {
		const tokens = tokenize(request.content, request.language)
		const response: TokenizeResponse = {
			type: "tokens",
			id: request.id,
			key: request.key,
			tokens,
		}
		self.postMessage(response)
	}
}
