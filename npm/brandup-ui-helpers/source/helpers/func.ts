/**
 * Wraps a callback so that, when invoked, it runs no sooner than `minTime` milliseconds
 * after this wrapper was created.
 *
 * The deadline is measured from the moment `minWait` is called. If `minTime` is omitted
 * or falsy, the original function is returned unchanged.
 *
 * @param func Callback to defer.
 * @param minTime Minimum delay in milliseconds before the callback may run.
 * @returns A wrapped function with the same arguments as `func`.
 */
const minWait = (func: (...args: any[]) => void, minTime?: number) => {
	if (!minTime)
		return func;

	const beginTime = Date.now();

	const ret = (...args: any[]) => {
		const rightTime = getRightTime(beginTime, minTime);
		if (rightTime)
			setTimeout(() => func(...args), rightTime);
		else
			func(...args);
	};

	return ret;
};

/**
 * Awaits an async operation and guarantees the returned promise settles no sooner than
 * `minTime` milliseconds after invocation, padding with an extra delay when needed.
 *
 * Useful for keeping spinners/loading states visible for a minimum duration. If `minTime`
 * is omitted or falsy, `func` is awaited and its result returned without padding.
 *
 * An already-aborted signal rejects immediately, before `func` runs; aborting later cancels
 * the padding delay (but not `func` itself, which can't be cancelled here).
 *
 * @typeParam TResult Result type produced by `func`.
 * @param func Factory returning the promise to await.
 * @param minTime Minimum total duration in milliseconds.
 * @param abort Optional signal used to cancel the wait.
 * @returns The result produced by `func`.
 */
async function minWaitAsync<TResult = unknown>(func: () => Promise<TResult>, minTime?: number, abort?: AbortSignal): Promise<TResult> {
	abort?.throwIfAborted();

	if (!minTime)
		return func();

	const beginTime = Date.now();
	const result = await func();

	const rightTime = getRightTime(beginTime, minTime);
	if (rightTime)
		await delay(rightTime, abort);

	return result;
}

/** @internal */
const getRightTime = (start: number, minTime: number) => {
	const finishTime = Date.now();
	const w = minTime - (finishTime - start);

	// Skip padding when the leftover is within 10% of `minTime`: the wait is already
	// "close enough", and a sub-tick delay would only add jitter without a visible effect.
	return w > minTime * 0.1 ? w : 0;
}

/**
 * Returns a promise that resolves after the given number of milliseconds.
 *
 * If an already-aborted signal is supplied the promise rejects immediately; otherwise
 * aborting before the delay elapses clears the timer and rejects with the abort reason.
 *
 * @param ms Delay in milliseconds; must be a non-negative number (`NaN` is rejected). Values
 *           above 2147483647 (~24.8 days) overflow the timer and fire on the next tick — a
 *           `setTimeout` limitation.
 * @param abort Optional signal used to cancel the delay.
 * @returns A promise that resolves when the delay elapses.
 * @throws {Error} When `ms` is negative or `NaN`.
 */
function delay(ms: number, abort?: AbortSignal): Promise<void> {
	if (!(ms >= 0))
		throw new Error("Invalid delay value.");

	return new Promise<void>((resolve, reject) => {
		abort?.throwIfAborted();

		const onAbort = () => {
			clearTimeout(timer);
			// `onAbort` only runs once the listener has fired, which means `abort` exists.
			reject(abort!.reason);
		};

		const timer = setTimeout(() => {
			abort?.removeEventListener("abort", onAbort);
			resolve();
		}, ms);

		abort?.addEventListener("abort", onAbort, { once: true });
	});
}

/**
 * Races a promise against a timeout.
 *
 * Resolves/rejects with the original promise if it settles in time. If the timeout elapses
 * first the returned promise rejects with a {@link TimeoutError}. Aborting via `abort`
 * rejects with the signal's reason.
 *
 * @typeParam T Resolved value type of the wrapped promise.
 * @param promise Promise to guard with a timeout.
 * @param ms Timeout in milliseconds; must be greater than `0`. Values above 2147483647
 *           (~24.8 days) overflow the timer and fire on the next tick — a `setTimeout` limitation.
 * @param abort Optional signal used to cancel the wait.
 * @returns A promise mirroring `promise` unless the timeout or abort fires first.
 * @throws {Error} When `ms` is not greater than `0` (including `NaN`).
 */
function timeout<T = unknown>(promise: Promise<T>, ms: number, abort?: AbortSignal): Promise<T> {
	if (!(ms > 0))
		throw new Error("Invalid timeout value.");

	// Own controller so the `delay` timer can be torn down once the race is decided,
	// independently of the caller's `abort`.
	const timer = new AbortController();

	// Wins the race only by timing out (rejects with TimeoutError). If the timer is cancelled
	// instead — the guarded work settled, or the caller aborted — `delay` rejects, and we turn
	// that into a never-settling promise so `expire` simply stands aside: the race never produces
	// a stray rejection that nobody is listening for.
	const expire = delay(ms, timer.signal).then(
		() => Promise.reject<T>(new TimeoutError()),
		() => new Promise<T>(() => { /* timer cancelled — let the real winner stand */ })
	);

	return abortable(Promise.race([promise, expire]), abort)
		.finally(() => timer.abort());
}

/**
 * Makes *waiting* for a promise abortable: rejects with the signal's reason on abort.
 * Does not stop the underlying work the promise performs.
 *
 * If no signal is supplied the promise is awaited as-is. An already-aborted signal rejects
 * immediately; otherwise the abort listener is removed once the promise settles.
 *
 * @typeParam T Resolved value type of the wrapped promise.
 * @param promise Promise (or thenable) whose wait should become abortable.
 * @param abort Optional signal used to cancel the wait.
 * @returns A promise mirroring `promise` unless the abort fires first.
 */
function abortable<T>(promise: PromiseLike<T>, abort?: AbortSignal): Promise<T> {
	if (!abort)
		return Promise.resolve(promise);

	if (abort.aborted)
		return Promise.reject(abort.reason);

	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(abort.reason);
		abort.addEventListener("abort", onAbort, { once: true });

		const cleanup = () => abort.removeEventListener("abort", onAbort);
		Promise.resolve(promise).then(
			v => { cleanup(); resolve(v); },
			e => { cleanup(); reject(e); }
		);
	});
}

/** Thrown by {@link timeout} when the time limit is exceeded. */
export class TimeoutError extends Error {
	constructor() {
		super("Timeout");
		this.name = "TimeoutError";
	}
}

export {
	minWait,
	minWaitAsync,
	delay,
	timeout,
	abortable
}
