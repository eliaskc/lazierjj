import type { SupportedLanguages } from "@pierre/diffs"
import { PROFILE_ENABLED } from "../utils/profiler"
import { tokenizeLineSync, type SyntaxToken } from "./syntax"

const CACHE_MAX_SIZE = 500
const syntaxCache = new Map<string, SyntaxToken[]>()

let cacheHits = 0
let cacheMisses = 0
let totalTokenizeMs = 0
let slowestTokenizeMs = 0
let slowestLanguage = ""

export function tokenizeWithCache(
	content: string,
	language: SupportedLanguages,
): SyntaxToken[] {
	const key = `${language}\0${content}`

	const cached = syntaxCache.get(key)
	if (cached) {
		if (PROFILE_ENABLED) cacheHits++
		return cached
	}

	if (PROFILE_ENABLED) cacheMisses++
	const start = PROFILE_ENABLED ? performance.now() : 0
	const tokens = tokenizeLineSync(content, language)

	if (PROFILE_ENABLED) {
		const elapsed = performance.now() - start
		totalTokenizeMs += elapsed
		if (elapsed > slowestTokenizeMs) {
			slowestTokenizeMs = elapsed
			slowestLanguage = language
		}
	}

	if (syntaxCache.size >= CACHE_MAX_SIZE) {
		const firstKey = syntaxCache.keys().next().value
		if (firstKey) {
			syntaxCache.delete(firstKey)
		}
	}

	syntaxCache.set(key, tokens)
	return tokens
}

export function getSyntaxStats(): {
	hits: number
	misses: number
	totalMs: number
	slowestMs: number
	slowestLang: string
} {
	return {
		hits: cacheHits,
		misses: cacheMisses,
		totalMs: totalTokenizeMs,
		slowestMs: slowestTokenizeMs,
		slowestLang: slowestLanguage,
	}
}

export function resetSyntaxStats(): void {
	cacheHits = 0
	cacheMisses = 0
	totalTokenizeMs = 0
	slowestTokenizeMs = 0
	slowestLanguage = ""
}

export function clearSyntaxCache(): void {
	syntaxCache.clear()
	resetSyntaxStats()
}

export function getSyntaxCacheSize(): number {
	return syntaxCache.size
}
