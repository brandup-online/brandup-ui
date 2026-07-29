import { AjaxQueue } from "../source/queue";
import type { AjaxRequest, AjaxResponse } from "../source/types";

jest.mock("../source/request", () => ({
	request: jest.fn()
}));

import { request } from "../source/request";

const mockRequest = request as jest.MockedFunction<typeof request>;

const makeResponse = (status = 200): AjaxResponse => ({
	status,
	data: null,
	type: "none",
	redirected: false,
	url: "/",
	contentType: null,
	headers: { get: () => null, has: () => false, forEach: () => {} }
});

/**
 * Mimics real request.ts: calls options.success then resolves.
 * Without this, enqueue's promise never resolves (it depends on success callback).
 */
function setupResolve(status = 200) {
	const res = makeResponse(status);
	mockRequest.mockImplementationOnce(async (req: AjaxRequest) => {
		req.success?.(res);
		return res;
	});
	return res;
}

/** Mimics real request.ts: calls options.error then rejects. */
function setupReject(reason = new Error("failed")) {
	mockRequest.mockImplementationOnce(async (req: AjaxRequest) => {
		req.error?.(req, reason);
		throw reason;
	});
	return reason;
}

/** Creates a deferred request mock that blocks until resolveWith() is called. */
function setupDeferred(status = 200) {
	const res = makeResponse(status);
	let resolveWith!: () => void;
	const gate = new Promise<void>(r => { resolveWith = r; });
	mockRequest.mockImplementationOnce(async (req: AjaxRequest) => {
		await gate;
		req.success?.(res);
		return res;
	});
	return { res, resolveWith };
}

/** Drains all pending microtasks by yielding to the macrotask queue. */
const flush = () => new Promise<void>(r => setTimeout(r, 0));

beforeEach(() => { mockRequest.mockReset(); });

// ── push ──────────────────────────────────────────────────────────────────────

it("push throws when queue is destroyed", () => {
	const queue = new AjaxQueue();
	queue.destroy();
	expect(() => queue.push({ url: "/" })).toThrow("AjaxQueue is destroyed.");
});

it("push starts executing immediately when idle", () => {
	setupResolve();
	const queue = new AjaxQueue();
	queue.push({ url: "/" });
	expect(mockRequest).toHaveBeenCalledTimes(1);
});

it("second request waits until first completes", async () => {
	const { resolveWith } = setupDeferred();
	setupResolve();

	const queue = new AjaxQueue();
	queue.push({ url: "/first" });
	const p2 = queue.enqueue({ url: "/second" });

	expect(mockRequest).toHaveBeenCalledTimes(1); // only first started

	resolveWith();
	await p2; // p2 resolves only after second request runs

	expect(mockRequest).toHaveBeenCalledTimes(2);
});

it("three requests execute serially in order", async () => {
	const order: number[] = [];
	for (let i = 1; i <= 3; i++) {
		const n = i;
		mockRequest.mockImplementationOnce(async (req: AjaxRequest) => {
			order.push(n);
			const res = makeResponse(200);
			req.success?.(res);
			return res;
		});
	}

	const queue = new AjaxQueue();
	const p1 = queue.enqueue({ url: "/1" });
	const p2 = queue.enqueue({ url: "/2" });
	const p3 = queue.enqueue({ url: "/3" });
	await Promise.all([p1, p2, p3]);

	expect(order).toEqual([1, 2, 3]);
});

// ── state properties ─────────────────────────────────────────────────────────

it("isFree / isEmpty / length are true when nothing queued", () => {
	const queue = new AjaxQueue();
	expect(queue.isFree).toBe(true);
	expect(queue.isEmpty).toBe(true);
	expect(queue.length).toBe(0);
});

it("length counts waiting (not executing) requests", async () => {
	const { resolveWith } = setupDeferred();
	setupResolve();

	const queue = new AjaxQueue();
	queue.push({ url: "/a" });
	const p2 = queue.enqueue({ url: "/b" });

	expect(queue.length).toBe(1);    // /b is waiting
	expect(queue.isFree).toBe(false);
	expect(queue.isEmpty).toBe(false);

	resolveWith();
	await p2;
	await flush(); // drain .then/.catch/.finally chain so __next clears _current

	expect(queue.length).toBe(0);
	expect(queue.isFree).toBe(true);
});

// ── reset ─────────────────────────────────────────────────────────────────────

it("reset clears waiting requests without stopping the current one", async () => {
	const { resolveWith } = setupDeferred();

	const queue = new AjaxQueue();
	const p1 = queue.enqueue({ url: "/a" });
	queue.push({ url: "/b" });
	queue.push({ url: "/c" });

	queue.reset();

	expect(queue.length).toBe(0);
	expect(mockRequest).toHaveBeenCalledTimes(1); // first still running

	resolveWith();
	await p1;
});

it("reset(true) aborts the current request signal", () => {
	let capturedSignal: AbortSignal | undefined;
	mockRequest.mockImplementationOnce((_req: AjaxRequest, signal?: AbortSignal) => {
		capturedSignal = signal;
		return new Promise(() => {}); // hangs indefinitely
	});

	const queue = new AjaxQueue();
	queue.push({ url: "/" });
	queue.reset(true);

	expect(capturedSignal?.aborted).toBe(true);
	expect(queue.length).toBe(0);
});

it("reset(true) stale-callback guard: __next bails out after reset", async () => {
	let resolveReq!: () => void;
	const gate = new Promise<void>(r => { resolveReq = r; });
	mockRequest.mockImplementationOnce(async () => {
		await gate;
		return makeResponse();
	});

	const queue = new AjaxQueue();
	queue.push({ url: "/" });
	queue.reset(true); // clears _current

	expect(queue.isFree).toBe(true);

	resolveReq(); // mock completes after reset
	await flush();

	// __next guard (this._current !== completedTask) fires; queue stays clean
	expect(queue.isFree).toBe(true);
	expect(queue.length).toBe(0);
});

// ── canRequest ────────────────────────────────────────────────────────────────

it("canRequest returning false skips the request without calling request()", () => {
	const canRequest = jest.fn().mockReturnValue(false);
	const queue = new AjaxQueue({ canRequest });
	queue.push({ url: "/" });
	expect(mockRequest).not.toHaveBeenCalled();
	expect(canRequest).toHaveBeenCalledTimes(1);
});

it("canRequest false skips first request then processes the next one", async () => {
	const canRequest = jest.fn()
		.mockReturnValueOnce(false) // skip first
		.mockReturnValue(true);    // allow second

	setupResolve();

	const queue = new AjaxQueue({ canRequest });
	queue.push({ url: "/skipped" });
	const p2 = queue.enqueue({ url: "/processed" });

	await p2;
	expect(mockRequest).toHaveBeenCalledTimes(1);
	expect((mockRequest.mock.calls[0][0] as AjaxRequest).url).toBe("/processed");
});

it("canRequest returning true allows the request through", () => {
	setupResolve();
	const queue = new AjaxQueue({ canRequest: () => true });
	queue.push({ url: "/" });
	expect(mockRequest).toHaveBeenCalledTimes(1);
});

it("canRequest returning undefined (void) allows the request through", () => {
	setupResolve();
	const queue = new AjaxQueue({ canRequest: () => undefined });
	queue.push({ url: "/" });
	expect(mockRequest).toHaveBeenCalledTimes(1);
});

// ── hooks ─────────────────────────────────────────────────────────────────────

it("successRequest hook is called with the response after completion", async () => {
	const successRequest = jest.fn();
	setupResolve(201);
	const queue = new AjaxQueue({ successRequest });
	await queue.enqueue({ url: "/" });
	await Promise.resolve(); // .then(successRequest) is a microtask after task.result resolves
	expect(successRequest).toHaveBeenCalledTimes(1);
	expect(successRequest.mock.calls[0][1].status).toBe(201);
});

it("successRequest hook not called after destroy", async () => {
	const { resolveWith } = setupDeferred();
	const successRequest = jest.fn();
	const queue = new AjaxQueue({ successRequest });
	queue.push({ url: "/" });

	queue.destroy();

	resolveWith();
	await flush();

	expect(successRequest).not.toHaveBeenCalled();
});

it("errorRequest hook is called when a request fails", async () => {
	const errorRequest = jest.fn();
	setupReject(new Error("Network error"));
	const queue = new AjaxQueue({ errorRequest });
	await expect(queue.enqueue({ url: "/" })).rejects.toThrow();
	await Promise.resolve();
	expect(errorRequest).toHaveBeenCalledTimes(1);
});

it("errorRequest hook not called after destroy", async () => {
	let rejectReq!: (e: Error) => void;
	const gate = new Promise<never>((_, r) => { rejectReq = r; });
	mockRequest.mockImplementationOnce(async (req: AjaxRequest) => {
		await gate;
		const err = new Error("late error");
		req.error?.(req, err);
		throw err;
	});
	const errorRequest = jest.fn();
	const queue = new AjaxQueue({ errorRequest });
	queue.push({ url: "/" });

	queue.destroy();

	rejectReq(new Error("late error"));
	await flush();

	expect(errorRequest).not.toHaveBeenCalled();
});

// ── enqueue ───────────────────────────────────────────────────────────────────

it("enqueue resolves with the response", async () => {
	setupResolve(200);
	const queue = new AjaxQueue();
	const res = await queue.enqueue({ url: "/" });
	expect(res.status).toBe(200);
});

it("enqueue rejects on failure", async () => {
	setupReject(new Error("fail"));
	const queue = new AjaxQueue();
	await expect(queue.enqueue({ url: "/" })).rejects.toThrow("fail");
});

it("enqueue still invokes the original success callback", async () => {
	const success = jest.fn();
	setupResolve();
	const queue = new AjaxQueue();
	await queue.enqueue({ url: "/", success });
	expect(success).toHaveBeenCalledTimes(1);
});

it("enqueue still invokes the original error callback", async () => {
	const error = jest.fn();
	setupReject();
	const queue = new AjaxQueue();
	await expect(queue.enqueue({ url: "/", error })).rejects.toThrow();
	expect(error).toHaveBeenCalledTimes(1);
});

it("deprecated enque delegates to enqueue", async () => {
	setupResolve(200);
	const queue = new AjaxQueue();
	const res = await queue.enque({ url: "/" });
	expect(res.status).toBe(200);
});

// ── destroy ────────────────────────────────────────────────────────────────────

it("destroy is idempotent", () => {
	const queue = new AjaxQueue();
	expect(() => { queue.destroy(); queue.destroy(); }).not.toThrow();
});

it("destroy aborts the current request signal", () => {
	let capturedSignal: AbortSignal | undefined;
	mockRequest.mockImplementationOnce((_req: AjaxRequest, signal?: AbortSignal) => {
		capturedSignal = signal;
		return new Promise(() => {});
	});

	const queue = new AjaxQueue();
	queue.push({ url: "/" });
	queue.destroy();

	expect(capturedSignal?.aborted).toBe(true);
});

// ── pre-cancelled requests ────────────────────────────────────────────────────

it("options.abort already aborted: rejected without calling request()", async () => {
	const abort = new AbortController();
	abort.abort("cancelled");

	const queue = new AjaxQueue();
	await expect(
		queue.enqueue({ url: "/", abort: abort.signal })
	).rejects.toThrow();

	expect(mockRequest).not.toHaveBeenCalled();
});

it("per-request cancel signal already aborted: rejected without calling request()", async () => {
	const abort = new AbortController();
	abort.abort("cancelled");

	const queue = new AjaxQueue();
	await expect(
		queue.enqueue({ url: "/" }, abort.signal)
	).rejects.toThrow();

	expect(mockRequest).not.toHaveBeenCalled();
});
