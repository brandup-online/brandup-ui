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
 * @typeParam TResult Result type produced by `func`.
 * @param func Factory returning the promise to await.
 * @param minTime Minimum total duration in milliseconds.
 * @param abort Optional signal used to cancel the padding delay.
 * @returns The result produced by `func`.
 */
async function minWaitAsync<TResult = unknown>(func: () => Promise<TResult>, minTime?: number, abort?: AbortSignal): Promise<TResult> {
	if (!minTime)
		return func();

	const beginTime = Date.now();
	const result = await func();

	const rightTime = getRightTime(beginTime, minTime);
	if (rightTime)
		await delay(rightTime, abort);

	return result;
};

/** @internal */
const getRightTime = (start: number, minTime: number) => {
	const finishTime = Date.now();
	const w = minTime - (finishTime - start);

	return w > minTime * 0.1 ? w : 0;
}

/**
 * Returns a promise that resolves after the given number of milliseconds.
 *
 * If an already-aborted signal is supplied the promise rejects immediately; otherwise
 * aborting before the delay elapses clears the timer and rejects with the abort reason.
 *
 * @param time Delay in milliseconds.
 * @param abort Optional signal used to cancel the delay.
 * @returns A promise that resolves when the delay elapses.
 */
function delay(time: number, abort?: AbortSignal): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		abort?.throwIfAborted();

		const onAbort = () => {
			clearTimeout(timer);
			reject(abort?.reason);
		};

		const timer = setTimeout(() => {
			abort?.removeEventListener("abort", onAbort);
			resolve();
		}, time);

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
 * @param timeout Timeout in milliseconds; must be greater than `0`.
 * @param abort Optional signal used to cancel the wait.
 * @returns A promise mirroring `promise` unless the timeout or abort fires first.
 * @throws {Error} When `timeout` is not greater than `0`.
 */
function timeout<T = unknown>(promise: Promise<T>, timeout: number, abort?: AbortSignal): Promise<T> {
	if (timeout <= 0)
		throw new Error("Invalid timeout value.");

	return new Promise<T>((resolve, reject) => {
		abort?.throwIfAborted();

		const onAbort = () => {
			clearTimeout(timer);
			reject(abort?.reason);
		};

		const timer = setTimeout(() => {
			abort?.removeEventListener("abort", onAbort);
			reject(new TimeoutError());
		}, timeout);

		abort?.addEventListener("abort", onAbort, { once: true });

		promise
			.then(result => resolve(result))
			.catch(reason => reject(reason))
			.finally(() => {
				clearTimeout(timer);
				abort?.removeEventListener("abort", onAbort);
			});
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
	timeout
}
