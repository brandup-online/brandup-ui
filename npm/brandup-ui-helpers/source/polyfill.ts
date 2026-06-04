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

		for (const signal of signals) {
			// If one is already aborted, the combined signal aborts immediately with its reason.
			if (signal.aborted) {
				controller.abort(signal.reason);
				break;
			}

			// Tying each listener to the combined signal removes them all once it aborts — no leak.
			signal.addEventListener("abort", () => controller.abort(signal.reason), { signal: controller.signal });
		}

		return controller.signal;
	};
}
