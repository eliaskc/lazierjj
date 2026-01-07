/**
 * Prefetch utility for warming jj's internal cache.
 *
 * When you navigate to a commit for the first time, jj needs to compute tree diffs
 * which can take ~600ms. Subsequent accesses to the same commit are fast (~60ms).
 *
 * This utility runs `jj diff --stat` in the background for visible commits,
 * warming jj's cache so that when the user navigates to them, they're already fast.
 *
 * Key design decisions:
 * - Only prefetch when user is IDLE (hasn't navigated for IDLE_DELAY_MS)
 * - Pause immediately when user starts navigating
 * - One prefetch at a time to minimize lock contention
 * - Prioritize nearby commits (around current selection)
 */

import { execute } from "../commander/executor"
import { profileMsg } from "./profiler"

// Track which changeIds have been prefetched this session
const prefetchedSet = new Set<string>()

// Queue of changeIds waiting to be prefetched
let prefetchQueue: string[] = []
let isPrefetching = false
let isPaused = false

// Timers
let idleTimer: ReturnType<typeof setTimeout> | null = null
let resumeTimer: ReturnType<typeof setTimeout> | null = null

// How long user must be idle before prefetching starts
const IDLE_DELAY_MS = 300

// How long to wait after pausing before resuming prefetch
const RESUME_DELAY_MS = 500

/**
 * Prefetch diff stats for a single commit.
 * Uses --ignore-working-copy to avoid locks and --stat for minimal output.
 */
async function prefetchOne(changeId: string): Promise<void> {
	if (prefetchedSet.has(changeId)) return

	try {
		// Run jj diff --stat which computes the tree diff and caches it
		await execute(["diff", "-r", changeId, "--stat", "--ignore-working-copy"])
		prefetchedSet.add(changeId)
		profileMsg(`prefetch: warmed ${changeId.slice(0, 8)}`)
	} catch {
		// Silently ignore errors - prefetch is best-effort
	}
}

/**
 * Process the prefetch queue one at a time.
 * Stops if paused or queue is empty.
 */
async function processQueue(): Promise<void> {
	if (isPrefetching) return
	isPrefetching = true

	while (prefetchQueue.length > 0 && !isPaused) {
		const changeId = prefetchQueue.shift()
		if (changeId && !prefetchedSet.has(changeId)) {
			await prefetchOne(changeId)
		}
	}

	isPrefetching = false

	// If paused and queue not empty, schedule resume
	if (isPaused && prefetchQueue.length > 0) {
		scheduleResume()
	}
}

/**
 * Schedule prefetch to resume after RESUME_DELAY_MS of inactivity.
 */
function scheduleResume(): void {
	if (resumeTimer) {
		clearTimeout(resumeTimer)
	}
	resumeTimer = setTimeout(() => {
		resumeTimer = null
		if (prefetchQueue.length > 0) {
			isPaused = false
			profileMsg(
				`prefetch: resuming (${prefetchQueue.length} commits in queue)`,
			)
			processQueue()
		}
	}, RESUME_DELAY_MS)
}

/**
 * Queue commits for prefetching.
 * Commits that are already prefetched or in the queue are skipped.
 * Prefetching starts after user is idle for IDLE_DELAY_MS.
 *
 * @param changeIds - Array of change IDs to prefetch
 * @param priority - If "high", prepend to queue (for nearby commits). If "low", append.
 */
export function queuePrefetch(
	changeIds: string[],
	priority: "high" | "low" = "low",
): void {
	const newIds = changeIds.filter(
		(id) => !prefetchedSet.has(id) && !prefetchQueue.includes(id),
	)

	if (newIds.length === 0) return

	if (priority === "high") {
		// Prepend high priority items (nearby commits)
		prefetchQueue = [...newIds, ...prefetchQueue]
	} else {
		// Append low priority items
		prefetchQueue.push(...newIds)
	}

	profileMsg(
		`prefetch: queued ${newIds.length} commits (queue size: ${prefetchQueue.length})`,
	)

	// Schedule prefetch to start after idle delay
	scheduleIdlePrefetch()
}

/**
 * Schedule prefetch processing to start after user is idle.
 */
function scheduleIdlePrefetch(): void {
	// Clear existing timer
	if (idleTimer) {
		clearTimeout(idleTimer)
	}

	// Don't start if already prefetching or paused
	if (isPrefetching) return

	idleTimer = setTimeout(() => {
		idleTimer = null
		if (prefetchQueue.length > 0 && !isPaused) {
			profileMsg(`prefetch: starting (idle for ${IDLE_DELAY_MS}ms)`)
			processQueue()
		}
	}, IDLE_DELAY_MS)
}

/**
 * Mark a changeId as already "warm" (e.g., user just selected it).
 * This prevents redundant prefetching.
 */
export function markPrefetched(changeId: string): void {
	prefetchedSet.add(changeId)
	// Remove from queue if present
	prefetchQueue = prefetchQueue.filter((id) => id !== changeId)
}

/**
 * Pause prefetching immediately.
 * Called when user starts navigating to avoid competing for jj locks.
 */
export function pausePrefetch(): void {
	if (idleTimer) {
		clearTimeout(idleTimer)
		idleTimer = null
	}
	if (resumeTimer) {
		clearTimeout(resumeTimer)
		resumeTimer = null
	}
	if (!isPaused && (isPrefetching || prefetchQueue.length > 0)) {
		isPaused = true
		profileMsg("prefetch: paused (user navigating)")
	}
}

/**
 * Signal that user activity has stopped, allowing prefetch to resume.
 */
export function signalIdle(): void {
	if (isPaused && prefetchQueue.length > 0) {
		scheduleResume()
	} else if (!isPaused && prefetchQueue.length > 0 && !isPrefetching) {
		scheduleIdlePrefetch()
	}
}

/**
 * Clear the prefetch queue (e.g., on refresh when commits change).
 */
export function clearPrefetchQueue(): void {
	prefetchQueue = []
	isPaused = false
	if (idleTimer) {
		clearTimeout(idleTimer)
		idleTimer = null
	}
	if (resumeTimer) {
		clearTimeout(resumeTimer)
		resumeTimer = null
	}
	// Don't clear prefetchedSet - those commits are still cached in jj
}

/**
 * Check if a changeId has been prefetched.
 */
export function isPrefetchedFn(changeId: string): boolean {
	return prefetchedSet.has(changeId)
}

/**
 * Get prefetch stats for debugging.
 */
export function getPrefetchStats(): {
	prefetched: number
	queued: number
	processing: boolean
	paused: boolean
} {
	return {
		prefetched: prefetchedSet.size,
		queued: prefetchQueue.length,
		processing: isPrefetching,
		paused: isPaused,
	}
}
