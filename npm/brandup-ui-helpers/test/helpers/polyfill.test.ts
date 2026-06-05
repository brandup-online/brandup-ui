// The polyfill module installs itself on import. jsdom already ships native AbortSignal
// methods, so each test removes the native implementation, re-runs the module in an isolated
// registry, then restores the original afterwards.
declare function require(moduleName: string): void;

const proto = AbortSignal.prototype as any;
const ctor = AbortSignal as any;

const native = {
	throwIfAborted: proto.throwIfAborted,
	timeout: ctor.timeout,
	any: ctor.any,
};

const installPolyfill = () => jest.isolateModules(() => require("../../source/polyfill"));

afterEach(() => {
	proto.throwIfAborted = native.throwIfAborted;
	ctor.timeout = native.timeout;
	ctor.any = native.any;
	jest.useRealTimers();
});

// ── installation guards ─────────────────────────────────────────────────────────

it("AbortSignal polyfill: keeps a native implementation when one exists", () => {
	installPolyfill();

	expect(proto.throwIfAborted).toBe(native.throwIfAborted);
	expect(ctor.timeout).toBe(native.timeout);
	expect(ctor.any).toBe(native.any);
});

it("AbortSignal polyfill: installs all three when missing", () => {
	delete proto.throwIfAborted;
	delete ctor.timeout;
	delete ctor.any;

	installPolyfill();

	expect(typeof proto.throwIfAborted).toBe("function");
	expect(typeof ctor.timeout).toBe("function");
	expect(typeof ctor.any).toBe("function");
});

// ── throwIfAborted ───────────────────────────────────────────────────────────────

it("AbortSignal polyfill throwIfAborted: throws the reason when aborted", () => {
	delete proto.throwIfAborted;
	installPolyfill();

	const abort = new AbortController();
	abort.abort("CANCEL");

	expect(() => abort.signal.throwIfAborted()).toThrow();
	try {
		abort.signal.throwIfAborted();
	} catch (e) {
		expect(e).toEqual("CANCEL");
	}
});

it("AbortSignal polyfill throwIfAborted: does nothing when not aborted", () => {
	delete proto.throwIfAborted;
	installPolyfill();

	expect(() => new AbortController().signal.throwIfAborted()).not.toThrow();
});

// ── AbortSignal.timeout ──────────────────────────────────────────────────────────

it("AbortSignal polyfill timeout: aborts with a TimeoutError after the delay", () => {
	jest.useFakeTimers();
	delete ctor.timeout;
	installPolyfill();

	const signal = AbortSignal.timeout(1000);
	expect(signal.aborted).toBe(false);

	jest.advanceTimersByTime(1000);

	expect(signal.aborted).toBe(true);
	expect(signal.reason).toBeInstanceOf(DOMException);
	expect(signal.reason.name).toBe("TimeoutError");
});

// ── AbortSignal.any ──────────────────────────────────────────────────────────────

it("AbortSignal polyfill any: aborts with the reason of the first signal to abort", () => {
	delete ctor.any;
	installPolyfill();

	const a = new AbortController();
	const b = new AbortController();
	const signal = AbortSignal.any([a.signal, b.signal]);

	expect(signal.aborted).toBe(false);

	b.abort("B");

	expect(signal.aborted).toBe(true);
	expect(signal.reason).toEqual("B");
});

it("AbortSignal polyfill any: detaches source listeners when the combined signal aborts", () => {
	delete ctor.any;
	installPolyfill();

	const a = new AbortController();
	const b = new AbortController();
	const offA = jest.spyOn(a.signal, "removeEventListener");
	const offB = jest.spyOn(b.signal, "removeEventListener");

	const signal = AbortSignal.any([a.signal, b.signal]);
	expect(signal.aborted).toBe(false);

	a.abort("A");

	expect(signal.aborted).toBe(true);
	// both source listeners must be removed — no leak, no reliance on the { signal } option
	expect(offA).toHaveBeenCalledWith("abort", expect.any(Function));
	expect(offB).toHaveBeenCalledWith("abort", expect.any(Function));
});

it("AbortSignal polyfill any: is already aborted when an input signal is", () => {
	delete ctor.any;
	installPolyfill();

	const a = new AbortController();
	a.abort("PRE");

	const signal = AbortSignal.any([a.signal, new AbortController().signal]);

	expect(signal.aborted).toBe(true);
	expect(signal.reason).toEqual("PRE");
});
