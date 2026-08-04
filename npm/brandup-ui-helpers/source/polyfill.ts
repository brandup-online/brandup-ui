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

/** Hidden back-reference from a combined signal to its controller — see `AbortSignal.any` below. */
const ANY_CONTROLLER = typeof Symbol === "function" ? Symbol("anyController") : "__anyController";

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
	// A combined signal that is simply dropped — the guarded work finished, nothing ever
	// aborted — must release the listeners it attached to its sources, or every discarded
	// combination piles up on a long-lived source signal (an app-scoped abort combined once
	// per navigation/request). The standard expresses this with weak references; mirror it:
	// sources are detached when the combined signal aborts, or when it is garbage collected.
	const weakSupported = typeof WeakRef === "function" && typeof FinalizationRegistry === "function";
	const detachRegistry = weakSupported ? new FinalizationRegistry((detach: () => void) => detach()) : null;

	/**
	 * Subscribe to every source and return the detacher the registry will hold.
	 *
	 * Deliberately a separate function: engines allocate one context object per scope and
	 * share it between all closures created there, so a `controller` variable sitting in the
	 * same scope would be reachable from the detacher — pinning the very signal the registry
	 * watches and disabling collection entirely. Here the controller is only ever reachable
	 * through `ref`, which is weak.
	 */
	const attachSources = (signals: AbortSignal[], ref: { deref: () => AbortController | undefined }): (() => void) => {
		const cleanups: Array<() => void> = [];

		const detachAll = () => {
			cleanups.forEach(off => off());
			cleanups.length = 0;
		};

		// Detach every source listener, then abort. Manual cleanup (rather than the
		// addEventListener `{ signal }` option) keeps this working on the same old runtimes
		// that lack AbortSignal.any in the first place.
		const abort = (reason: unknown) => {
			detachAll();
			ref.deref()?.abort(reason);
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

		return detachAll;
	};

	AbortSignal.any = (signals: AbortSignal[]): AbortSignal => {
		const controller = new AbortController();
		const detachAll = attachSources(signals, weakSupported ? new WeakRef(controller) : { deref: () => controller });

		// The caller only keeps the signal, so anchor the controller to it: the weak handle
		// must stay alive exactly as long as the combined signal, and no longer. The two form
		// a cycle, which collectors reclaim as a unit.
		Object.defineProperty(controller.signal, ANY_CONTROLLER, { value: controller });

		// After an abort the cleanups are already spent, so a late registry callback is a no-op.
		detachRegistry?.register(controller.signal, detachAll);

		return controller.signal;
	};
}
