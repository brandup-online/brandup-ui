import "../../source/index";

describe('Object', () => {
	it('Object.prop', () => {
		const model = {
			name: "Test"
		};

		const value = Object.prop(model, "name");
		expect(value).toBe(model.name);
	});

	it('Object.hasProp', () => {
		const model = {
			name: "Test"
		};

		const has = Object.hasProp(model, "name");
		expect(has).toBe(true);
	});
});

describe('String', () => {
	it('String.format', () => {
		const template = "Hello, {name}";
		const result = template.format({ name: "Dmitry" });
		expect(result).toBe("Hello, Dmitry");
	});
});