/**
 * Runtime polyfills for `AbortSignal`, installed only when the host lacks them:
 * `AbortSignal.prototype.throwIfAborted`, `AbortSignal.timeout` and `AbortSignal.any`.
 *
 * Import for its side effect — there are no exports:
 *
 * ```TypeScript
 * import "@brandup/ui-helpers/polyfill";
 * ```
 *
 * Types already ship with the TypeScript `ESNext` lib; this module only fills in the
 * implementations missing in older runtimes, matching the standard behaviour.
 */

if (typeof AbortSignal.prototype.throwIfAborted !== "function") {
	AbortSignal.prototype.throwIfAborted = function (this: AbortSignal): void {
		if (this.aborted)
			throw this.reason;
	};
}

if (typeof AbortSignal.timeout !== "function") {
	AbortSignal.timeout = (milliseconds: number): AbortSignal => {
		const controller = new AbortController();
		setTimeout(() => controller.abort(new DOMException("The operation timed out.", "TimeoutError")), milliseconds);
		return controller.signal;
	};
}

if (typeof AbortSignal.any !== "function") {
	AbortSignal.any = (signals: AbortSignal[]): AbortSignal => {
		const controller = new AbortController();
		const cleanups: Array<() => void> = [];

		// Detach every source listener, then abort. Manual cleanup (rather than the
		// addEventListener `{ signal }` option) keeps this working on the same old runtimes
		// that lack AbortSignal.any in the first place — no listener leak.
		const abort = (reason: unknown) => {
			cleanups.forEach(off => off());
			cleanups.length = 0;
			controller.abort(reason);
		};

		for (const signal of signals) {
			// If one is already aborted, the combined signal aborts immediately with its reason.
			if (signal.aborted) {
				abort(signal.reason);
				break;
			}

			const onAbort = () => abort(signal.reason);
			signal.addEventListener("abort", onAbort);
			cleanups.push(() => signal.removeEventListener("abort", onAbort));
		}

		return controller.signal;
	};
}
