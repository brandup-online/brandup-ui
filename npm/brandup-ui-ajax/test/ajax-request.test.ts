import { ajaxRequest } from "../source/ajax-request";

// ── guard: body not allowed on GET/HEAD ───────────────────────────────────────

it("ajaxRequest rejects GET with data regardless of method case", () => {
	expect(() => ajaxRequest({ url: "/x", method: "GET", data: { a: "1" } }))
		.toThrow("GET method does not support a request body.");

	expect(() => ajaxRequest({ url: "/x", method: "get", data: { a: "1" } }))
		.toThrow("GET method does not support a request body.");
});

it("ajaxRequest rejects HEAD with data", () => {
	expect(() => ajaxRequest({ url: "/x", method: "HEAD", data: { a: "1" } }))
		.toThrow("HEAD method does not support a request body.");
});

// ── XHR mock setup ────────────────────────────────────────────────────────────

class MockXHR {
	withCredentials = false;
	timeout = 0;
	readyState = 0;
	response: any = null;
	responseText = "";
	responseURL = "";
	status = 0;
	onreadystatechange: ((e: any) => void) | null = null;
	onabort: ((e: any) => void) | null = null;
	onerror: ((e: any) => void) | null = null;
	ontimeout: ((e: any) => void) | null = null;

	method = "";
	url = "";
	body: any = undefined;
	requestHeaders: Record<string, string> = {};

	private _responseHeaders: Record<string, string> = {};

	open(method: string, url: string, _async: boolean) {
		this.method = method;
		this.url = url;
	}

	setRequestHeader(name: string, value: string) {
		this.requestHeaders[name.toLowerCase()] = value;
	}

	send(body?: any) {
		this.body = body;
	}

	getResponseHeader(name: string): string | null {
		return this._responseHeaders[name.toLowerCase()] ?? null;
	}

	getAllResponseHeaders(): string {
		return Object.entries(this._responseHeaders)
			.map(([k, v]) => `${k}: ${v}`)
			.join("\r\n");
	}

	simulateResponse(status: number, text: string, headers: Record<string, string>) {
		this._responseHeaders = Object.fromEntries(
			Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
		);
		this.status = status;
		this.responseText = text;
		this.response = text || null;
		this.readyState = 4;
		this.onreadystatechange?.({} as any);
	}

	simulateAbort() { this.onabort?.({} as any); }
	simulateError() { this.onerror?.({} as any); }
	simulateTimeout() { this.ontimeout?.({} as any); }
}

let lastXHR: MockXHR;
const OriginalXHR = (global as any).XMLHttpRequest;

beforeEach(() => {
	const Ctor = function (this: any) {
		lastXHR = new MockXHR();
		return lastXHR;
	};
	(Ctor as any).DONE = 4;
	(global as any).XMLHttpRequest = Ctor;
});

afterEach(() => {
	(global as any).XMLHttpRequest = OriginalXHR;
});

// ── XHR properties ────────────────────────────────────────────────────────────

it("withCredentials is always set to true", () => {
	ajaxRequest({ url: "/api" });
	expect(lastXHR.withCredentials).toBe(true);
});

it("timeout is forwarded to XHR when specified", () => {
	ajaxRequest({ url: "/api", timeout: 5000 });
	expect(lastXHR.timeout).toBe(5000);
});

it("timeout of 0 disables the XHR timeout", () => {
	ajaxRequest({ url: "/api", timeout: 0 });
	expect(lastXHR.timeout).toBe(0);
});

it("timeout not set when option omitted", () => {
	ajaxRequest({ url: "/api" });
	expect(lastXHR.timeout).toBe(0); // MockXHR default
});

it("X-Requested-With header is always sent", () => {
	ajaxRequest({ url: "/api" });
	expect(lastXHR.requestHeaders["x-requested-with"]).toBe("XMLHttpRequest");
});

it("custom headers are forwarded to XHR", () => {
	ajaxRequest({ url: "/api", headers: { "X-Auth": "token123" } });
	expect(lastXHR.requestHeaders["x-auth"]).toBe("token123");
});

it("method is normalized to upper case", () => {
	ajaxRequest({ url: "/api", method: "post" as any, type: "TEXT", data: "x" });
	expect(lastXHR.method).toBe("POST");
});

it("GET sends no body", () => {
	ajaxRequest({ url: "/api" });
	expect(lastXHR.body).toBeUndefined();
});

it("POST sends a body", () => {
	ajaxRequest({ url: "/api", method: "POST", type: "JSON", data: { x: 1 } });
	expect(lastXHR.method).toBe("POST");
	expect(lastXHR.body).toBeTruthy();
});

it("query params are appended to the URL", () => {
	ajaxRequest({ url: "http://localhost/api", query: { foo: "bar" } });
	expect(lastXHR.url).toBe("http://localhost/api?foo=bar");
});

it("disableCache appends _ cache-buster to the URL", () => {
	ajaxRequest({ url: "http://localhost/api", disableCache: true });
	expect(lastXHR.url).toMatch(/\?_=\d+$/);
});

// ── readyState guard ──────────────────────────────────────────────────────────

it("ignores readystatechange events fired before DONE", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", success });
	// Simulate intermediate state (e.g. LOADING = 3)
	lastXHR.readyState = 3;
	lastXHR.onreadystatechange?.({} as any);
	expect(success).not.toHaveBeenCalled();
});

// ── response parsing ─────────────────────────────────────────────────────────

it("success callback receives parsed JSON", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", success });
	lastXHR.simulateResponse(200, '{"ok":true}', { "Content-Type": "application/json" });

	expect(success).toHaveBeenCalledTimes(1);
	const res = success.mock.calls[0][0];
	expect(res.status).toBe(200);
	expect(res.type).toBe("json");
	expect(res.data).toEqual({ ok: true });
});

it("success callback receives text/plain as text", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", success });
	lastXHR.simulateResponse(200, "hello", { "Content-Type": "text/plain" });

	const res = success.mock.calls[0][0];
	expect(res.type).toBe("text");
	expect(res.data).toBe("hello");
});

it("success callback receives text/html as html", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", success });
	lastXHR.simulateResponse(200, "<p>hi</p>", { "Content-Type": "text/html" });

	const res = success.mock.calls[0][0];
	expect(res.type).toBe("html");
	expect(res.data).toBe("<p>hi</p>");
});

it("success callback receives type=none when no body", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", success });
	lastXHR.simulateResponse(204, "", {});

	const res = success.mock.calls[0][0];
	expect(res.type).toBe("none");
	expect(res.data).toBeNull();
});

it("response URL comes from xhr.responseURL", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", success });
	lastXHR.responseURL = "http://localhost/redirected";
	lastXHR.simulateResponse(200, "", {});

	expect(success.mock.calls[0][0].url).toBe("http://localhost/redirected");
});

it("state is passed through to success result", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", state: { id: 42 }, success });
	lastXHR.simulateResponse(200, "", {});
	expect(success.mock.calls[0][0].state).toEqual({ id: 42 });
});

it("response headers support get, has, and forEach", () => {
	const success = jest.fn();
	ajaxRequest({ url: "/api", success });
	lastXHR.simulateResponse(200, '{"ok":true}', {
		"Content-Type": "application/json",
		"X-Custom": "value"
	});

	const { headers } = success.mock.calls[0][0];
	expect(headers.get("content-type")).toBe("application/json");
	expect(headers.get("x-custom")).toBe("value");
	expect(headers.get("x-nonexistent")).toBeNull();
	expect(headers.has("content-type")).toBe(true);
	expect(headers.has("x-nonexistent")).toBe(false);

	const collected: Record<string, string> = {};
	headers.forEach((value: string, key: string) => { collected[key] = value; });
	expect(collected["content-type"]).toBe("application/json");
	expect(collected["x-custom"]).toBe("value");
});

// ── error callbacks ───────────────────────────────────────────────────────────

it("error callback passes an Error on abort", () => {
	const error = jest.fn();
	ajaxRequest({ url: "/api", error });
	lastXHR.simulateAbort();

	expect(error).toHaveBeenCalledTimes(1);
	expect(error.mock.calls[0][1]).toBeInstanceOf(Error);
	expect(error.mock.calls[0][1].message).toBe("Request aborted");
});

it("error callback passes an Error on network error", () => {
	const error = jest.fn();
	ajaxRequest({ url: "/api", error });
	lastXHR.simulateError();

	expect(error.mock.calls[0][1]).toBeInstanceOf(Error);
	expect(error.mock.calls[0][1].message).toBe("Request network error");
});

it("error callback passes an Error on timeout", () => {
	const error = jest.fn();
	ajaxRequest({ url: "/api", error });
	lastXHR.simulateTimeout();

	expect(error.mock.calls[0][1]).toBeInstanceOf(Error);
	expect(error.mock.calls[0][1].message).toBe("Request timeout");
});

it("error callback called when JSON parsing fails", () => {
	const error = jest.fn();
	ajaxRequest({ url: "/api", success: jest.fn(), error });
	lastXHR.simulateResponse(200, "{bad json}", { "Content-Type": "application/json" });

	expect(error).toHaveBeenCalledTimes(1);
});

it("does not throw when no success or error callbacks are set", () => {
	expect(() => {
		ajaxRequest({ url: "/api" });
		lastXHR.simulateResponse(200, "ok", { "Content-Type": "text/plain" });
		lastXHR.simulateAbort();
		lastXHR.simulateError();
		lastXHR.simulateTimeout();
	}).not.toThrow();
});
