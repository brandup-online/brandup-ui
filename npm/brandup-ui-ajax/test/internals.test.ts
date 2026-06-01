import internals from "../source/internals";
import type { AjaxRequest } from "../source/types";

// ── detectRequestType ─────────────────────────────────────────────────────────

it("detectRequestType: Blob → BLOB", () => {
	const options: AjaxRequest = { data: new Blob(["x"]) };
	internals.detectRequestType(options);
	expect(options.type).toBe("BLOB");
});

it("detectRequestType: FormData → FORMDATA", () => {
	const options: AjaxRequest = { data: new FormData() };
	internals.detectRequestType(options);
	expect(options.type).toBe("FORMDATA");
});

it("detectRequestType: HTMLFormElement → FORM", () => {
	const options: AjaxRequest = { data: document.createElement("form") };
	internals.detectRequestType(options);
	expect(options.type).toBe("FORM");
});

it("detectRequestType: plain object → JSON", () => {
	const options: AjaxRequest = { data: { a: 1 } };
	internals.detectRequestType(options);
	expect(options.type).toBe("JSON");
});

it("detectRequestType: string → TEXT", () => {
	const options: AjaxRequest = { data: "hello" };
	internals.detectRequestType(options);
	expect(options.type).toBe("TEXT");
});

it("detectRequestType: does not override an already-set type", () => {
	const options: AjaxRequest = { type: "XML", data: { a: 1 } };
	internals.detectRequestType(options);
	expect(options.type).toBe("XML");
});

it("detectRequestType: does nothing when data is absent", () => {
	const options: AjaxRequest = {};
	internals.detectRequestType(options);
	expect(options.type).toBeUndefined();
});

it("detectRequestType: does nothing when data is null", () => {
	const options: AjaxRequest = { data: null };
	internals.detectRequestType(options);
	expect(options.type).toBeUndefined();
});

// ── prepareRequest ─────────────────────────────────────────────────────────────

it("prepareRequest JSON: serializes body and sets Content-Type + Accept", () => {
	const result = internals.prepareRequest({ type: "JSON" } as AjaxRequest, { a: 1 });
	expect(result.headers["Content-Type"]).toBe("application/json; charset=utf-8");
	expect(result.headers["Accept"]).toBe("application/json, text/json, */*; q=0.01");
	expect(result.body).toBe('{"a":1}');
});

it("prepareRequest XML: sets Content-Type + Accept, body unchanged", () => {
	const result = internals.prepareRequest({ type: "XML" } as AjaxRequest, "<x/>");
	expect(result.headers["Content-Type"]).toBe("application/xml; charset=utf-8");
	expect(result.headers["Accept"]).toBe("application/xml, text/xml, */*; q=0.01");
	expect(result.body).toBe("<x/>");
});

it("prepareRequest FORM + FormData: url-encodes body, sets Content-Type", () => {
	const form = new FormData();
	form.append("k", "v");
	const result = internals.prepareRequest({ type: "FORM" } as AjaxRequest, form);
	expect(result.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
	expect(result.body).toBe("k=v");
});

// jsdom's FormData constructor does not accept HTMLFormElement in the current environment.
// The code path is: HTMLFormElement → new FormData(form) → encodeForm().
// The FORM + FormData test above verifies the encodeForm half; this test is skipped.
it.skip("prepareRequest FORM + HTMLFormElement: converts to FormData then url-encodes", () => {
	const form = document.createElement("form");
	const input = document.createElement("input");
	input.name = "key";
	input.value = "val";
	form.appendChild(input);
	document.body.appendChild(form);
	try {
		const result = internals.prepareRequest({ type: "FORM" } as AjaxRequest, form);
		expect(result.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
		expect(result.body).toContain("key=val");
	} finally {
		document.body.removeChild(form);
	}
});

it("prepareRequest FORMDATA: no Content-Type, body is the original FormData", () => {
	const form = new FormData();
	form.append("x", "1");
	const result = internals.prepareRequest({ type: "FORMDATA" } as AjaxRequest, form);
	expect(result.headers["Content-Type"]).toBeUndefined();
	expect(result.body).toBe(form);
});

it("prepareRequest TEXT: sets Content-Type text/plain, body unchanged", () => {
	const result = internals.prepareRequest({ type: "TEXT" } as AjaxRequest, "hello");
	expect(result.headers["Content-Type"]).toBe("text/plain");
	expect(result.body).toBe("hello");
});

it("prepareRequest BLOB: no Content-Type, body is the original Blob", () => {
	const blob = new Blob(["data"]);
	const result = internals.prepareRequest({ type: "BLOB" } as AjaxRequest, blob);
	expect(result.headers["Content-Type"]).toBeUndefined();
	expect(result.body).toBe(blob);
});

it("prepareRequest NONE: no headers set, body unchanged", () => {
	const result = internals.prepareRequest({ type: "NONE" } as AjaxRequest, "x");
	expect(result.headers["Content-Type"]).toBeUndefined();
	expect(result.headers["Accept"]).toBeUndefined();
	expect(result.body).toBe("x");
});

it("prepareRequest with no type: no headers set, body unchanged", () => {
	const result = internals.prepareRequest({} as AjaxRequest, "x");
	expect(result.headers).toEqual({});
	expect(result.body).toBe("x");
});

it("prepareRequest: custom headers are forwarded", () => {
	const result = internals.prepareRequest({ headers: { "X-Custom": "val" } } as AjaxRequest, null);
	expect(result.headers["X-Custom"]).toBe("val");
});

it("prepareRequest: headers with empty values are skipped", () => {
	const result = internals.prepareRequest({ headers: { "X-Empty": "" } } as AjaxRequest, null);
	expect(result.headers["X-Empty"]).toBeUndefined();
});

it("prepareRequest: custom headers and type headers both appear in output", () => {
	const result = internals.prepareRequest({ type: "JSON", headers: { "X-Token": "abc" } } as AjaxRequest, {});
	expect(result.headers["X-Token"]).toBe("abc");
	expect(result.headers["Content-Type"]).toBe("application/json; charset=utf-8");
});
