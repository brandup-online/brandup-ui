import { TypeHelper } from "../../source/index";

describe("isFunction", () => {
	it("returns true for a regular function", () => {
		expect(TypeHelper.isFunction(() => {})).toBe(true);
	});

	it("returns true for a named function", () => {
		function fn() {}
		expect(TypeHelper.isFunction(fn)).toBe(true);
	});

	it("returns true for a class constructor", () => {
		class Foo {}
		expect(TypeHelper.isFunction(Foo)).toBe(true);
	});

	it("returns false for a string", () => {
		expect(TypeHelper.isFunction("fn")).toBe(false);
	});

	it("returns false for a number", () => {
		expect(TypeHelper.isFunction(42)).toBe(false);
	});

	it("returns false for an object", () => {
		expect(TypeHelper.isFunction({})).toBe(false);
	});

	it("returns false for null", () => {
		expect(TypeHelper.isFunction(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(TypeHelper.isFunction(undefined)).toBe(false);
	});
});

describe("isString", () => {
	it("returns true for a string primitive", () => {
		expect(TypeHelper.isString("hello")).toBe(true);
	});

	it("returns true for an empty string", () => {
		expect(TypeHelper.isString("")).toBe(true);
	});

	it("returns true for a String object instance", () => {
		expect(TypeHelper.isString(new String("hello"))).toBe(true);
	});

	it("returns false for a number", () => {
		expect(TypeHelper.isString(42)).toBe(false);
	});

	it("returns false for a boolean", () => {
		expect(TypeHelper.isString(true)).toBe(false);
	});

	it("returns false for null", () => {
		expect(TypeHelper.isString(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(TypeHelper.isString(undefined)).toBe(false);
	});

	it("returns false for an object", () => {
		expect(TypeHelper.isString({})).toBe(false);
	});
});
