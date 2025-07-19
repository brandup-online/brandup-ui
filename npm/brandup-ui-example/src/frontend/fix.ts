if (!AbortSignal.prototype.throwIfAborted) {
	AbortSignal.prototype.throwIfAborted = function () {
		if (this.aborted)
			throw new Error('Aborted');
	}
}

if (!AbortSignal.any) {
	AbortSignal.any = (signals: AbortSignal[]): AbortSignal => {
		if (!signals || !signals.length)
			throw new Error('AbortSignal array is empty.');

		const controller = new AbortController();
		signals.forEach(s => s.addEventListener("abort", () => controller.abort(s.reason)))
		return controller.signal;
	};
}

if (!AbortSignal.timeout) {
	AbortSignal.timeout = (milliseconds: number): AbortSignal => {
		const controller = new AbortController();
		window.setTimeout(() => controller.abort("TimeoutError"), milliseconds);
		return controller.signal;
	};
}