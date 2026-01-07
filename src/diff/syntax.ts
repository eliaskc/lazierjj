import {
	type DiffsHighlighter,
	type SupportedLanguages,
	getFiletypeFromFileName,
	getSharedHighlighter,
} from "@pierre/diffs"

export interface SyntaxToken {
	content: string
	color?: string
}

let highlighter: DiffsHighlighter | null = null
let highlighterPromise: Promise<DiffsHighlighter> | null = null

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

export async function initHighlighter(): Promise<void> {
	if (highlighter) return
	if (highlighterPromise) {
		await highlighterPromise
		return
	}

	highlighterPromise = getSharedHighlighter({
		themes: ["ayu-dark"],
		langs: COMMON_LANGS,
	})

	highlighter = await highlighterPromise

	warmupHighlighterAsync()
}

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

function warmupHighlighterAsync(): void {
	if (!highlighter) return

	let langIndex = 0
	let patternIndex = 0

	const processOne = () => {
		if (!highlighter) return
		if (langIndex >= WARMUP_LANGS.length) return

		const lang = WARMUP_LANGS[langIndex]
		const pattern = WARMUP_PATTERNS[patternIndex]

		if (lang && pattern) {
			highlighter.codeToTokens(pattern, { lang, theme: "ayu-dark" })
		}

		patternIndex++
		if (patternIndex >= WARMUP_PATTERNS.length) {
			patternIndex = 0
			langIndex++
		}

		if (langIndex < WARMUP_LANGS.length) {
			setTimeout(processOne, 0)
		}
	}

	setTimeout(processOne, 0)
}

async function getHighlighter(): Promise<DiffsHighlighter> {
	if (highlighter) return highlighter
	await initHighlighter()
	if (!highlighter) {
		throw new Error("Failed to initialize highlighter")
	}
	return highlighter
}

export function getLanguage(filename: string): SupportedLanguages {
	return getFiletypeFromFileName(filename)
}

export async function tokenizeLine(
	content: string,
	language: SupportedLanguages,
): Promise<SyntaxToken[]> {
	try {
		const hl = await getHighlighter()

		const loadedLangs = hl.getLoadedLanguages()
		if (!loadedLangs.includes(language)) {
			try {
				await hl.loadLanguage(language)
			} catch {
				return [{ content }]
			}
		}

		const result = hl.codeToTokens(content, {
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

export function tokenizeLineSync(
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

export function isHighlighterReady(): boolean {
	return highlighter !== null
}
