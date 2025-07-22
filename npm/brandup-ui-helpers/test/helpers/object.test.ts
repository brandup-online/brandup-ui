import { ObjectHelper } from "../../source/index";

describe("getProperty", () => {
	it("Object is null", () => {
		const model = null;
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBeNull();

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(false);
	});

	it("Object is undefined", () => {
		const model = undefined;
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBeNull();

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(false);
	});

	it("Return first level value", () => {
		const model = {
			name: "Test"
		}
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBe(model.name);

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return second level value", () => {
		const model = {
			item: {
				name: "Test"
			}
		}
		const value = ObjectHelper.getProperty(model, "item.name");
		expect(value).toBe(model.item.name);

		const has = ObjectHelper.hasProperty(model, "item.name");
		expect(has).toBe(true);
	});

	it("Return null value", () => {
		const model = {
			name: null
		}
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBeNull();

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return empty string value", () => {
		const model = {
			name: ""
		}
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBe("");

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return zero value", () => {
		const model = {
			name: 0
		}
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBe(0);

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(true);
	});

	it("Return undefined value", () => {
		const model = {}
		const value = ObjectHelper.getProperty(model, "name");
		expect(value).toBeUndefined();

		const has = ObjectHelper.hasProperty(model, "name");
		expect(has).toBe(false);
	});
});