import { ObjectHelper } from "../../source/index";

describe("getValue", () => {
	it("Return value", () => {
		expect(ObjectHelper.getValue(testObj, "layout.nav.logo.title")).toBe("LedTrees");
	});

	it("If key undefined", () => {
		expect(ObjectHelper.getValue(testObj, "layout.nav.lang.ar")).toBeUndefined();
	});

	it("If obj undefined", () => {
		expect(ObjectHelper.getValue(testObj, "missing.anyKey")).toBeUndefined();
	});

	it("Returns value for single-level key", () => {
		expect(ObjectHelper.getValue(testObj, "hello")).toBe("world");
	});
});

const testObj = {
	hello: "world",
	layout: {
		nav: {
			logo: {
				title: "LedTrees",
			},
			langs: {
				en: {
					title: "английский",
				},
				ru: {
					title: "русский",
				},
				ar: {
					title: "",
				},
				zh: {
					title: "китайский",
				},
			},
		},
		footer: {
			copy: "{year} права защищены",
			policy: "Политика конфиденциальности",
		},
	},
};
