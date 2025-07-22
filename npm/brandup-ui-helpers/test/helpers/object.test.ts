import { ObjectHelper } from "../../source/index";

describe("getProperty", () => {
	it("Return value", () => {
		expect(ObjectHelper.getProperty(testObj, "layout.nav.logo.title")).toBe("LedTrees");
	});

	it("If key undefined", () => {
		expect(ObjectHelper.getProperty(testObj, "layout.nav.lang.ar")).toBeUndefined();
	});

	it("If obj undefined", () => {
		expect(ObjectHelper.getProperty(testObj, "missing.anyKey")).toBeUndefined();
	});

	it("Returns value for single-level key", () => {
		expect(ObjectHelper.getProperty(testObj, "hello")).toBe("world");
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
