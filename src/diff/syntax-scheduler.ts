import type { SupportedLanguages } from "@pierre/diffs"
import { batch, createSignal } from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { PROFILE_ENABLED, profileLog } from "../utils/profiler"
import type { SyntaxToken } from "./syntax"

const DEFAULT_CACHE_SIZE = 500
const MAX_LINE_LENGTH = 500

interface TokenizeRequest {
	type: "tokenize"
	id: string
	key: string
	content: string
	language: SupportedLanguages
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

interface PendingRequest {
	key: string
	generation: number
	resolve: (tokens: SyntaxToken[]) => void
}

interface SyntaxSchedulerOptions {
	cacheSize?: number
}

interface SchedulerStats {
	generation: number
	pendingCount: number
	storeSize: number
	tokensProcessed: number
	workerReady: boolean
}

let sharedWorker: Worker | null = null
let workerReady = false
let workerReadyPromise: Promise<void> | null = null
const pendingRequests = new Map<string, PendingRequest>()
let requestIdCounter = 0
const schedulerCallbacks = new Set<(response: TokenizeResponse) => void>()
const queuedPrefetches: Array<() => void> = []

function getWorker(): Worker {
	if (sharedWorker) return sharedWorker

	sharedWorker = new Worker(
		new URL("./syntax-worker.ts", import.meta.url).href,
		{ type: "module" },
	)

	sharedWorker.onmessage = (e: MessageEvent<WorkerResponse>) => {
		const response = e.data

		if (response.type === "ready") {
			workerReady = true
			for (const fn of queuedPrefetches) {
				fn()
			}
			queuedPrefetches.length = 0
			return
		}

		if (response.type === "error") {
			console.error("[SyntaxWorker] Error:", response.error)
			return
		}

		if (response.type === "tokens") {
			for (const callback of schedulerCallbacks) {
				callback(response)
			}
		}
	}

	sharedWorker.onerror = (e) => {
		console.error("[SyntaxWorker] Worker error:", e)
	}

	return sharedWorker
}

function initWorker(): Promise<void> {
	if (workerReady) return Promise.resolve()
	if (workerReadyPromise) return workerReadyPromise

	const worker = getWorker()

	workerReadyPromise = new Promise((resolve) => {
		const checkReady = () => {
			if (workerReady) {
				resolve()
			} else {
				setTimeout(checkReady, 10)
			}
		}

		worker.postMessage({ type: "init" })
		checkReady()
	})

	return workerReadyPromise
}

initWorker()

export function createSyntaxScheduler(options: SyntaxSchedulerOptions = {}) {
	const cacheSize = options.cacheSize ?? DEFAULT_CACHE_SIZE

	const [tokenStore, setTokenStore] = createStore<
		Record<string, SyntaxToken[]>
	>({})
	const storeKeys: string[] = []
	let generation = 0
	const [version, setVersion] = createSignal(0)
	const inFlight = new Set<string>()
	let tokensProcessed = 0

	const handleTokenResponse = (response: TokenizeResponse) => {
		const pending = pendingRequests.get(response.id)
		if (!pending) return

		pendingRequests.delete(response.id)
		inFlight.delete(pending.key)

		if (pending.generation !== generation) {
			return
		}

		batch(() => {
			if (storeKeys.length >= cacheSize && !tokenStore[pending.key]) {
				const oldest = storeKeys.shift()
				if (oldest) {
					setTokenStore(oldest, undefined as unknown as SyntaxToken[])
				}
			}

			setTokenStore(pending.key, response.tokens)
			if (!storeKeys.includes(pending.key)) {
				storeKeys.push(pending.key)
			}
			setVersion((v) => v + 1)
		})

		tokensProcessed++
	}

	schedulerCallbacks.add(handleTokenResponse)

	return {
		bumpGeneration() {
			generation++
			inFlight.clear()

			if (PROFILE_ENABLED) {
				profileLog("syntax-scheduler-bump", { generation })
			}
		},

		clearStore() {
			generation++
			inFlight.clear()
			storeKeys.length = 0
			setTokenStore(reconcile({}))
			tokensProcessed = 0
		},

		prefetch(
			items: Array<{
				key: string
				content: string
				language: SupportedLanguages
			}>,
			_priority: "high" | "low" = "high",
		) {
			const doPrefetch = () => {
				const worker = getWorker()
				const currentGen = generation

				for (const item of items) {
					if (tokenStore[item.key] || inFlight.has(item.key)) continue

					if (item.content.length > MAX_LINE_LENGTH) {
						batch(() => {
							setTokenStore(item.key, [{ content: item.content }])
							if (!storeKeys.includes(item.key)) {
								storeKeys.push(item.key)
							}
							setVersion((v) => v + 1)
						})
						continue
					}

					inFlight.add(item.key)
					const id = `req_${requestIdCounter++}`

					pendingRequests.set(id, {
						key: item.key,
						generation: currentGen,
						resolve: () => {},
					})

					const request: TokenizeRequest = {
						type: "tokenize",
						id,
						key: item.key,
						content: item.content,
						language: item.language,
					}

					worker.postMessage(request)
				}
			}

			if (workerReady) {
				doPrefetch()
			} else {
				queuedPrefetches.push(doPrefetch)
			}
		},

		get store() {
			return tokenStore
		},

		version,

		getTokens(key: string): SyntaxToken[] | undefined {
			return tokenStore[key]
		},

		makeKey(content: string, language: SupportedLanguages): string {
			return `${language}\0${content}`
		},

		getStats(): SchedulerStats {
			return {
				generation,
				pendingCount: pendingRequests.size,
				storeSize: storeKeys.length,
				tokensProcessed,
				workerReady,
			}
		},

		dispose() {
			schedulerCallbacks.delete(handleTokenResponse)
		},
	}
}

export type SyntaxScheduler = ReturnType<typeof createSyntaxScheduler>
