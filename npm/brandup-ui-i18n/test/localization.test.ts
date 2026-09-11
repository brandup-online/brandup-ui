import { createI18n, LocaleNamespaceImpl, LocalizationBuilder } from "../source/index";

type Lang = "en" | "ru" | "ar";

const options = { supported: ["en", "ru", "ar"] as const, default: "en" as const, rtl: ["ar"] as const };

describe("LocaleNamespaceImpl.t", () => {
	interface Model { greeting: string; user: { hello: string; }; group?: { child: string; }; onlyDefault?: string; }

	const current: Model = { greeting: "Hello", user: { hello: "Hello, {name}" }, group: { child: "x" } };
	const def: Model = { greeting: "Hi", user: { hello: "Hi, {name}" }, onlyDefault: "Default only" };

	it("requires a namespace name", () => {
		expect(() => new LocaleNamespaceImpl("", {}, {})).toThrow();
	});

	it("returns value for string key", () => {
		const locale = new LocaleNamespaceImpl("test", current, def);
		expect(locale.t("greeting")).toBe("Hello");
	});

	it("returns value for nested string path", () => {
		const locale = new LocaleNamespaceImpl("test", current, def);
		expect(locale.t("user.hello", { name: "Dmitry" })).toBe("Hello, Dmitry");
	});

	it("extracts key from arrow expression", () => {
		const locale = new LocaleNamespaceImpl<Model>("test", current, def);
		expect(locale.t(m => m.user.hello, { name: "Dmitry" })).toBe("Hello, Dmitry");
	});

	it("extracts key from block-body expression", () => {
		const locale = new LocaleNamespaceImpl<Model>("test", current, def);
		expect(locale.t(m => { return m.greeting; })).toBe("Hello");
	});

	it("extracts key from function expression", () => {
		const locale = new LocaleNamespaceImpl<Model>("test", current, def);
		expect(locale.t(function (m) { return m.greeting; })).toBe("Hello");
	});

	it("throws when key cannot be extracted", () => {
		const locale = new LocaleNamespaceImpl<Model>("test", current, def);
		expect(() => locale.t(() => "greeting")).toThrow();
	});

	it("returns path when not found", () => {
		const locale = new LocaleNamespaceImpl("test", {}, {});
		expect(locale.t("missing.path")).toBe("missing.path");
	});

	it("falls back to default language", () => {
		const locale = new LocaleNamespaceImpl<any>("test", {}, def);
		expect(locale.t("greeting")).toBe("Hi");
	});

	it("falls back to default when current path is an object", () => {
		const locale = new LocaleNamespaceImpl<any>("test", current, { group: "Group" });
		expect(locale.t("group")).toBe("Group");
	});

	it("keeps an empty string as a valid translation", () => {
		const locale = new LocaleNamespaceImpl("test", { empty: "" }, { empty: "Default" });
		expect(locale.t("empty")).toBe("");
	});

	it("caches values", () => {
		const locale = new LocaleNamespaceImpl<any>("test", { greeting: "Hello" }, def);
		expect(locale.t("greeting")).toBe("Hello");
		locale.current.greeting = "Changed";
		expect(locale.t("greeting")).toBe("Hello");
	});
});

describe("createI18n", () => {
	it("resolves supported language", () => {
		const i18n = createI18n<Lang>({ ...options, lang: "ru" });
		expect(i18n.CURRENT_LANG).toBe("ru");
		expect(i18n.IS_RTL).toBe(false);
	});

	it("drops region and normalizes case", () => {
		const i18n = createI18n<Lang>({ ...options, lang: "AR-sa" });
		expect(i18n.CURRENT_LANG).toBe("ar");
		expect(i18n.IS_RTL).toBe(true);
	});

	it("falls back to default for unsupported, empty and null lang", () => {
		expect(createI18n<Lang>({ ...options, lang: "de" }).CURRENT_LANG).toBe("en");
		expect(createI18n<Lang>({ ...options, lang: "" }).CURRENT_LANG).toBe("en");
		expect(createI18n<Lang>({ ...options, lang: null }).CURRENT_LANG).toBe("en");
		expect(createI18n<Lang>({ ...options, lang: undefined }).CURRENT_LANG).toBe("en");
	});

	it("IS_RTL is false when rtl is not configured", () => {
		const i18n = createI18n<Lang>({ supported: options.supported, default: "en", lang: "ar" });
		expect(i18n.IS_RTL).toBe(false);
	});
});

describe("createI18n.buildLocalization", () => {
	interface Model { greeting: string; }

	it("loads current and default dictionaries", async () => {
		const i18n = createI18n<Lang>({ ...options, lang: "ru" });
		const en = jest.fn(async () => ({ greeting: "Hello" }));
		const ru = jest.fn(async () => ({ greeting: "Привет" }));

		const locale = await i18n.buildLocalization<Model>("common", b => b.add("en", en).add("ru", ru));

		expect(locale.t(m => m.greeting)).toBe("Привет");
		expect(en).toHaveBeenCalledTimes(1);
		expect(ru).toHaveBeenCalledTimes(1);
	});

	it("loads only the default dictionary when languages match", async () => {
		const i18n = createI18n<Lang>({ ...options, lang: "en" });
		const en = jest.fn(async () => ({ greeting: "Hello" }));
		const ru = jest.fn(async () => ({ greeting: "Привет" }));

		const locale = await i18n.buildLocalization<Model>("common", b => b.add("en", en).add("ru", ru));

		expect(locale.t("greeting")).toBe("Hello");
		expect(en).toHaveBeenCalledTimes(1);
		expect(ru).not.toHaveBeenCalled();
	});

	it("uses the default dictionary when the current language has no loader", async () => {
		const i18n = createI18n<Lang>({ ...options, lang: "ru" });

		const locale = await i18n.buildLocalization<Model>("common", b => b.add("en", async () => ({ greeting: "Hello" })));

		expect(locale.t("greeting")).toBe("Hello");
	});

	it("throws when the default dictionary is missing", async () => {
		const i18n = createI18n<Lang>({ ...options, lang: "ru" });

		await expect(i18n.buildLocalization<Model>("common", b => b.add("ru", async () => ({ greeting: "Привет" })))).rejects.toThrow();
	});

	it("throws on duplicate namespace", async () => {
		const i18n = createI18n<Lang>({ ...options, lang: "en" });
		const configure = (b: LocalizationBuilder<Lang, Model>) => b.add("en", async () => ({ greeting: "Hello" }));

		await i18n.buildLocalization<Model>("common", configure);
		await expect(i18n.buildLocalization<Model>("common", configure)).rejects.toThrow();
	});

	it("throws on duplicate namespace while the first one is still loading", async () => {
		const i18n = createI18n<Lang>({ ...options, lang: "en" });
		const en = jest.fn(async () => ({ greeting: "Hello" }));
		const configure = (b: LocalizationBuilder<Lang, Model>) => b.add("en", en);

		const first = i18n.buildLocalization<Model>("common", configure);
		const second = i18n.buildLocalization<Model>("common", configure);

		await expect(second).rejects.toThrow();
		await expect(first).resolves.toBeDefined();
		expect(en).toHaveBeenCalledTimes(1);
	});

	it("allows a retry after a failed build", async () => {
		const i18n = createI18n<Lang>({ ...options, lang: "en" });

		await expect(i18n.buildLocalization<Model>("common", b => b.add("ru", async () => ({ greeting: "Привет" })))).rejects.toThrow();

		const locale = await i18n.buildLocalization<Model>("common", b => b.add("en", async () => ({ greeting: "Hello" })));
		expect(locale.t("greeting")).toBe("Hello");
	});
});
