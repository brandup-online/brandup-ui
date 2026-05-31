import { ObjectHelper } from "../../source/index";

describe("getProperty", () => {
	it("Object is null", () => {
		const value = ObjectHelper.getProperty(null, "name");
		expect(value).toBeNull();

		const has = ObjectHelper.hasProperty(null, "name");
		expect(has).toBe(false);
	});

	it("Object is undefined", () => {
		const value = ObjectHelper.getProperty(undefined, "name");
		expect(value).toBeNull();

		const has = ObjectHelper.hasProperty(undefined, "name");
		expect(has).toBe(false);
	});

	it("Return first level value", () => {
		const model = { name: "Test" };
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBe(model.name);

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return second level value", () => {
		const model = { item: { name: "Test" } };
		const value = ObjectHelper.getProperty(model, "item.name");
		expect(value).toBe(model.item.name);

		const has = ObjectHelper.hasProperty(model, "item.name");
		expect(has).toBe(true);
	});

	it("Return null value", () => {
		const model = { name: null };
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBeNull();

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return empty string value", () => {
		const model = { name: "" };
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBe("");

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return zero value", () => {
		const model = { name: 0 };
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBe(0);

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return undefined value", () => {
		const model = {};
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBeUndefined();

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(false);
	});

	it("returns undefined (not crash) when mid-path value is null", () => {
		expect(ObjectHelper.getProperty({ a: null }, "a.b")).toBeUndefined();
		expect(ObjectHelper.hasProperty({ a: null }, "a.b")).toBe(false);
	});

	it("returns undefined (not crash) when mid-path value is a primitive", () => {
		expect(ObjectHelper.getProperty({ a: 0 }, "a.b")).toBeUndefined();
		expect(ObjectHelper.getProperty({ a: "" }, "a.b")).toBeUndefined();
		expect(ObjectHelper.getProperty({ a: false }, "a.b")).toBeUndefined();

		expect(ObjectHelper.hasProperty({ a: 0 }, "a.b")).toBe(false);
		expect(ObjectHelper.hasProperty({ a: "" }, "a.b")).toBe(false);
	});

	it("traverses three levels deep", () => {
		const model = { a: { b: { c: 42 } } };
		expect(ObjectHelper.getProperty(model, "a.b.c")).toBe(42);
		expect(ObjectHelper.hasProperty(model, "a.b.c")).toBe(true);
	});

	it("returns undefined for a missing intermediate segment", () => {
		const model = { a: { x: 1 } };
		expect(ObjectHelper.getProperty(model, "a.b.c")).toBeUndefined();
		expect(ObjectHelper.hasProperty(model, "a.b.c")).toBe(false);
	});
});
