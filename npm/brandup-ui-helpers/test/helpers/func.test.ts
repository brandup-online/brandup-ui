import { FuncHelper } from "../../source/index";

// ── timeout ───────────────────────────────────────────────────────────────────

it("FuncHelper timeout: resolves when promise resolves in time", async () => {
	const result = await FuncHelper.timeout(Promise.resolve("test"), 5000);
	expect(result).toEqual("test");
});

it("FuncHelper timeout: rejects when inner promise rejects", async () => {
	await expect(
		FuncHelper.timeout(Promise.reject(new Error("error")), 5000)
	).rejects.toThrow("error");
});

it("FuncHelper timeout: rejects with TimeoutError when time elapses", async () => {
	await expect(
		FuncHelper.timeout(
			new Promise<string>(resolve => setTimeout(() => resolve("test"), 2000)),
			1000
		)
	).rejects.toThrow(FuncHelper.TimeoutError);
});

it("FuncHelper timeout: rejects with abort reason when already aborted", async () => {
	const abort = new AbortController();
	abort.abort("CANCEL");

	await expect(
		FuncHelper.timeout(
			new Promise<string>(resolve => setTimeout(() => resolve("test"), 2000)),
			1000,
			abort.signal
		)
	).rejects.toEqual(abort.signal.reason);
});

it("FuncHelper timeout: rejects when abort fires during the wait", async () => {
	const abort = new AbortController();

	const promise = FuncHelper.timeout(
		new Promise<string>(resolve => setTimeout(() => resolve("test"), 5000)),
		5000,
		abort.signal
	);

	abort.abort("CANCEL");
	await expect(promise).rejects.toEqual("CANCEL");
});

it("FuncHelper timeout: throws synchronously for invalid timeout", () => {
	const promise = Promise.resolve("test");
	expect(() => FuncHelper.timeout(promise, 0)).toThrow("Invalid timeout value.");
	expect(() => FuncHelper.timeout(promise, -1)).toThrow("Invalid timeout value.");
});

// ── delay ─────────────────────────────────────────────────────────────────────

it("FuncHelper delay: resolves after the given time", async () => {
	await expect(FuncHelper.delay(20)).resolves.toBeUndefined();
});

it("FuncHelper delay: rejects immediately when signal is already aborted", async () => {
	const abort = new AbortController();
	abort.abort("CANCEL");

	await expect(FuncHelper.delay(50, abort.signal)).rejects.toEqual("CANCEL");
});

it("FuncHelper delay: rejects when abort fires during the wait", async () => {
	const abort = new AbortController();

	const promise = FuncHelper.delay(1000, abort.signal);
	abort.abort("CANCEL");

	await expect(promise).rejects.toEqual("CANCEL");
});

// ── minWait ───────────────────────────────────────────────────────────────────

it("FuncHelper minWait: returns original function when no minTime", () => {
	const fn = jest.fn();
	const wrapped = FuncHelper.minWait(fn);
	expect(wrapped).toBe(fn);
});

it("FuncHelper minWait: returns original function when minTime is 0", () => {
	const fn = jest.fn();
	const wrapped = FuncHelper.minWait(fn, 0);
	expect(wrapped).toBe(fn);
});

it("FuncHelper minWait: delays call when invoked before minTime elapses", () => {
	jest.useFakeTimers();
	try {
		const fn = jest.fn();
		const wrapped = FuncHelper.minWait(fn, 100);

		wrapped("arg");
		expect(fn).not.toHaveBeenCalled();

		jest.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledWith("arg");
	} finally {
		jest.useRealTimers();
	}
});

it("FuncHelper minWait: calls immediately when minTime has already elapsed", () => {
	jest.useFakeTimers();
	try {
		const fn = jest.fn();
		const wrapped = FuncHelper.minWait(fn, 100);

		jest.advanceTimersByTime(200); // fast-forward past minTime

		wrapped("arg");
		expect(fn).toHaveBeenCalledWith("arg");
	} finally {
		jest.useRealTimers();
	}
});

it("FuncHelper minWait: forwards all arguments to the original function", () => {
	jest.useFakeTimers();
	try {
		const fn = jest.fn();
		const wrapped = FuncHelper.minWait(fn, 100);
		wrapped(1, "two", true);
		jest.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledWith(1, "two", true);
	} finally {
		jest.useRealTimers();
	}
});

// ── minWaitAsync ──────────────────────────────────────────────────────────────

it("FuncHelper minWaitAsync: returns result when no minTime", async () => {
	const result = await FuncHelper.minWaitAsync(() => Promise.resolve("value"));
	expect(result).toBe("value");
});

it("FuncHelper minWaitAsync: returns correct result with minTime", async () => {
	const result = await FuncHelper.minWaitAsync(() => Promise.resolve("value"), 10);
	expect(result).toBe("value");
}, 500);

it("FuncHelper minWaitAsync: rejects when func rejects", async () => {
	await expect(
		FuncHelper.minWaitAsync(() => Promise.reject(new Error("fail")), 10)
	).rejects.toThrow("fail");
}, 500);

it("FuncHelper minWaitAsync: rejects when abort fires during padding delay", async () => {
	const abort = new AbortController();
	const fn = jest.fn().mockResolvedValue("result");

	const promise = FuncHelper.minWaitAsync(fn, 10000, abort.signal);
	abort.abort("CANCEL");

	await expect(promise).rejects.toEqual("CANCEL");
});
