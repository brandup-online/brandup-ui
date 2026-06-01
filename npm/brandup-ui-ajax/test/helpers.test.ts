import { createQuery, addQuery, encodeForm } from "../source/helpers";

// ── createQuery from FormData ─────────────────────────────────────────────────

it("createQuery from FormData", () => {
	const form = new FormData();
	form.append("a", "1");
	form.append("b", "2");
	form.append("b", "3");

	const params = createQuery(form);

	expect(params.getAll("a")).toEqual(["1"]);
	expect(params.getAll("b")).toEqual(["2", "3"]);
});

it("createQuery from FormData does not mutate source", () => {
	const form = new FormData();
	form.append("a", "1");

	createQuery(form);

	expect(form.getAll("a")).toEqual(["1"]);
});

it("createQuery from FormData skips entries with empty key", () => {
	const form = new FormData();
	form.append("", "ignored");
	form.append("valid", "yes");

	const params = createQuery(form);

	expect(params.getAll("valid")).toEqual(["yes"]);
	expect(params.toString()).not.toContain("ignored");
});

// ── createQuery from object ───────────────────────────────────────────────────

it("createQuery from object with arrays", () => {
	const params = createQuery({ a: "1", b: ["2", "3"] });

	expect(params.getAll("a")).toEqual(["1"]);
	expect(params.getAll("b")).toEqual(["2", "3"]);
});

it("createQuery from plain object with single values", () => {
	const params = createQuery({ x: "hello", y: "world" });

	expect(params.get("x")).toBe("hello");
	expect(params.get("y")).toBe("world");
});

it("createQuery from object skips null values", () => {
	const params = createQuery({ a: "1", b: null as any });

	expect(params.get("a")).toBe("1");
	expect(params.has("b")).toBe(false);
});

// ── createQuery with empty / nullish input ────────────────────────────────────

it("createQuery returns empty URLSearchParams for null", () => {
	const params = createQuery(null);
	expect(params.toString()).toBe("");
});

it("createQuery returns empty URLSearchParams for undefined", () => {
	const params = createQuery(undefined);
	expect(params.toString()).toBe("");
});

// ── addQuery ──────────────────────────────────────────────────────────────────

it("addQuery appends FormData params", () => {
	const form = new FormData();
	form.append("x", "1");

	expect(addQuery("/path", form)).toEqual("/path?x=1");
	expect(addQuery("/path?y=0", form)).toEqual("/path?y=0&x=1");
});

it("addQuery appends QueryData object params", () => {
	expect(addQuery("/path", { key: "val" })).toBe("/path?key=val");
	expect(addQuery("/path?a=1", { b: "2" })).toBe("/path?a=1&b=2");
});

it("addQuery returns URL unchanged when query is null", () => {
	expect(addQuery("/path", null)).toBe("/path");
});

it("addQuery returns URL unchanged when query is undefined", () => {
	expect(addQuery("/path", undefined)).toBe("/path");
});

it("addQuery returns URL unchanged when query produces no params", () => {
	// An object with all null values produces an empty URLSearchParams (size 0)
	expect(addQuery("/path", { a: null as any })).toBe("/path");
});

// ── encodeForm ────────────────────────────────────────────────────────────────

it("encodeForm URL-encodes FormData key-value pairs", () => {
	const form = new FormData();
	form.append("name", "value");
	expect(encodeForm(form)).toBe("name=value");
});

it("encodeForm handles repeated keys", () => {
	const form = new FormData();
	form.append("tag", "a");
	form.append("tag", "b");
	expect(encodeForm(form)).toBe("tag=a&tag=b");
});

it("encodeForm URL-encodes special characters", () => {
	const form = new FormData();
	form.append("q", "hello world");
	expect(encodeForm(form)).toBe("q=hello+world");
});
