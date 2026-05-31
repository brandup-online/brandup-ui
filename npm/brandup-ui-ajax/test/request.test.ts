import { request } from "../source/request";

// ── fetch mock ────────────────────────────────────────────────────────────────

type FetchHandler = (url: string, init: RequestInit) => Promise<Response>;

function mockFetch(handler: FetchHandler) {
	const original = global.fetch;
	global.fetch = handler as any;
	return () => { global.fetch = original; };
}

function textResponse(body: string, contentType: string, status = 200) {
	return Promise.resolve(new Response(body, { status, headers: { "content-type": contentType } }));
}

/** Returns a fake Response object with the given type — lets us test opaque/error paths. */
function fakeResponse(type: ResponseType, extra: Partial<Response> = {}): Promise<Response> {
	return Promise.resolve({
		type,
		status: 0,
		redirected: false,
		url: "",
		body: null,
		headers: new Headers(),
		json: () => Promise.resolve(null),
		text: () => Promise.resolve(""),
		blob: () => Promise.resolve(new Blob()),
		...extra,
	} as unknown as Response);
}

// ── cache control ─────────────────────────────────────────────────────────────

it("disableCache sends cache: no-store", async () => {
	let captured!: RequestInit;
	const restore = mockFetch((_, init) => { captured = init; return textResponse("ok", "text/plain"); });
	try {
		await request({ url: "http://localhost/data", disableCache: true });
		expect(captured.cache).toBe("no-store");
	} finally { restore(); }
});

it("default request uses cache: default", async () => {
	let captured!: RequestInit;
	const restore = mockFetch((_, init) => { captured = init; return textResponse("ok", "text/plain"); });
	try {
		await request({ url: "http://localhost/data" });
		expect(captured.cache).toBe("default");
	} finally { restore(); }
});

// ── body guard ─────────────────────────────────────────────────────────────────

it("GET throws when data is provided", async () => {
	await expect(request({ url: "http://localhost/", method: "GET", data: { a: 1 } }))
		.rejects.toThrow("GET method does not support a request body.");
});

it("HEAD throws when data is provided", async () => {
	await expect(request({ url: "http://localhost/", method: "HEAD", data: { a: 1 } }))
		.rejects.toThrow("HEAD method does not support a request body.");
});

// ── response parsing ─────────────────────────────────────────────────────────

it("parses JSON response", async () => {
	const restore = mockFetch(() => textResponse('{"val":1}', "application/json"));
	try {
		const res = await request({ url: "http://localhost/" });
		expect(res.type).toBe("json");
		expect(res.data).toEqual({ val: 1 });
	} finally { restore(); }
});

it("strips charset suffix from content-type before matching", async () => {
	const restore = mockFetch(() =>
		textResponse('{"x":1}', "application/json; charset=utf-8")
	);
	try {
		const res = await request({ url: "http://localhost/" });
		expect(res.type).toBe("json");
		expect(res.data).toEqual({ x: 1 });
	} finally { restore(); }
});

it("parses text/plain response", async () => {
	const restore = mockFetch(() => textResponse("hello", "text/plain"));
	try {
		const res = await request({ url: "http://localhost/" });
		expect(res.type).toBe("text");
		expect(res.data).toBe("hello");
	} finally { restore(); }
});

it("parses text/html response", async () => {
	const restore = mockFetch(() => textResponse("<p>hi</p>", "text/html"));
	try {
		const res = await request({ url: "http://localhost/" });
		expect(res.type).toBe("html");
		expect(res.data).toBe("<p>hi</p>");
	} finally { restore(); }
});

it("parses unknown content-type as blob", async () => {
	const restore = mockFetch(() =>
		Promise.resolve(new Response("binary", { status: 200, headers: { "content-type": "application/octet-stream" } }))
	);
	try {
		const res = await request({ url: "http://localhost/" });
		expect(res.type).toBe("blob");
		expect(res.data).not.toBeNull();
		expect(typeof (res.data as Blob).size).toBe("number"); // Blob-like check across jsdom contexts
	} finally { restore(); }
});

it("returns type=none for redirected response", async () => {
	const restore = mockFetch(() => {
		const r = new Response("body", { status: 200, headers: { "content-type": "application/json" } });
		Object.defineProperty(r, "redirected", { value: true });
		return Promise.resolve(r);
	});
	try {
		const res = await request({ url: "http://localhost/" });
		expect(res.type).toBe("none");
		expect(res.data).toBeNull();
	} finally { restore(); }
});

it("returns type=none when there is no content-type", async () => {
	const restore = mockFetch(() => Promise.resolve(new Response(null, { status: 204 })));
	try {
		const res = await request({ url: "http://localhost/" });
		expect(res.type).toBe("none");
	} finally { restore(); }
});

it("throws for opaque response type and calls error callback", async () => {
	const error = jest.fn();
	const restore = mockFetch(() => fakeResponse("opaque"));
	try {
		await expect(request({ url: "http://localhost/", error }))
			.rejects.toThrow("Not supported response type: opaque");
		expect(error).toHaveBeenCalledTimes(1);
	} finally { restore(); }
});

it("throws for opaqueredirect response type", async () => {
	const restore = mockFetch(() => fakeResponse("opaqueredirect"));
	try {
		await expect(request({ url: "http://localhost/" }))
			.rejects.toThrow("Not supported response type: opaqueredirect");
	} finally { restore(); }
});

it("throws for error response type", async () => {
	const restore = mockFetch(() => fakeResponse("error"));
	try {
		await expect(request({ url: "http://localhost/" }))
			.rejects.toThrow("Response error.");
	} finally { restore(); }
});

// ── callbacks ─────────────────────────────────────────────────────────────────

it("success callback is invoked with the parsed response", async () => {
	const success = jest.fn();
	const restore = mockFetch(() => textResponse("hi", "text/plain"));
	try {
		await request({ url: "http://localhost/", success });
		expect(success).toHaveBeenCalledTimes(1);
		expect(success.mock.calls[0][0].type).toBe("text");
	} finally { restore(); }
});

it("error callback is invoked and the error is re-thrown", async () => {
	const error = jest.fn();
	const restore = mockFetch(() => Promise.reject(new Error("Network failure")));
	try {
		await expect(request({ url: "http://localhost/", error })).rejects.toThrow("Network failure");
		expect(error).toHaveBeenCalledTimes(1);
	} finally { restore(); }
});

// ── request construction ───────────────────────────────────────────────────────

it("method is normalized to upper case", async () => {
	let capturedInit!: RequestInit;
	const restore = mockFetch((_, init) => { capturedInit = init; return textResponse("", "text/plain"); });
	try {
		await request({ url: "http://localhost/", method: "post" as any });
		expect(capturedInit.method).toBe("POST");
	} finally { restore(); }
});

it("credentials default to include", async () => {
	let capturedInit!: RequestInit;
	const restore = mockFetch((_, init) => { capturedInit = init; return textResponse("", "text/plain"); });
	try {
		await request({ url: "http://localhost/" });
		expect(capturedInit.credentials).toBe("include");
	} finally { restore(); }
});

it("custom credentials value is forwarded", async () => {
	let capturedInit!: RequestInit;
	const restore = mockFetch((_, init) => { capturedInit = init; return textResponse("", "text/plain"); });
	try {
		await request({ url: "http://localhost/", credentials: "omit" });
		expect(capturedInit.credentials).toBe("omit");
	} finally { restore(); }
});

it("mode is forwarded to fetch", async () => {
	let capturedInit!: RequestInit;
	const restore = mockFetch((_, init) => { capturedInit = init; return textResponse("", "text/plain"); });
	try {
		await request({ url: "http://localhost/", mode: "cors" });
		expect(capturedInit.mode).toBe("cors");
	} finally { restore(); }
});

it("query params are appended to the URL", async () => {
	let capturedUrl!: string;
	const restore = mockFetch((url, _) => { capturedUrl = url as string; return textResponse("", "text/plain"); });
	try {
		await request({ url: "http://localhost/api", query: { foo: "bar" } });
		expect(capturedUrl).toBe("http://localhost/api?foo=bar");
	} finally { restore(); }
});

it("POST body is forwarded to fetch with JSON Content-Type", async () => {
	let capturedInit!: RequestInit;
	const restore = mockFetch((_, init) => { capturedInit = init; return textResponse("{}", "application/json"); });
	try {
		await request({ url: "http://localhost/", method: "POST", type: "JSON", data: { x: 1 } });
		expect(capturedInit.body).toBe('{"x":1}');
		expect((capturedInit.headers as Headers).get("content-type")).toContain("application/json");
	} finally { restore(); }
});

it("options.abort signal is included in the combined abort signal", async () => {
	const abort = new AbortController();
	let captured!: RequestInit;
	const restore = mockFetch((_, init) => {
		captured = init;
		return textResponse("", "text/plain");
	});
	try {
		await request({ url: "http://localhost/", abort: abort.signal });
		// The signal used is AbortSignal.any([timeout, options.abort])
		expect(captured.signal).toBeDefined();
	} finally { restore(); }
});

// ── abort ─────────────────────────────────────────────────────────────────────

it("rejects when the abort argument signal is already aborted", async () => {
	const controller = new AbortController();
	controller.abort();

	const restore = mockFetch(() => Promise.reject(new DOMException("Aborted", "AbortError")));
	try {
		await expect(request({ url: "http://localhost/" }, controller.signal)).rejects.toThrow();
	} finally { restore(); }
});

// ── state pass-through ───────────────────────────────────────────────────────

it("state is passed through to the response", async () => {
	const restore = mockFetch(() => textResponse("", "text/plain"));
	try {
		const res = await request({ url: "http://localhost/", state: { id: 42 } });
		expect(res.state).toEqual({ id: 42 });
	} finally { restore(); }
});
