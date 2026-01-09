import { type SupportedLanguages, getFiletypeFromFileName } from "@pierre/diffs"

export interface SyntaxToken {
	content: string
	color?: string
}

export async function initHighlighter(): Promise<void> {}

export function getLanguage(filename: string): SupportedLanguages {
	return getFiletypeFromFileName(filename)
}

export async function tokenizeLine(
	content: string,
	_language: SupportedLanguages,
): Promise<SyntaxToken[]> {
	return [{ content }]
}

export function tokenizeLineSync(
	content: string,
	_language: SupportedLanguages,
): SyntaxToken[] {
	return [{ content }]
}

export function isHighlighterReady(): boolean {
	return false
}
