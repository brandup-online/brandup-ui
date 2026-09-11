import { ObjectHelper, formatText } from "@brandup/ui-helpers";

// Extracts the key from the function source: `m => m.a.b.c`. Both the arrow and the
// transpiled `function` forms are supported, with optional parentheses and a block body
// (`{ return ... }`). Without the "g" flag the expression is stateless and can be shared,
// which avoids recreating it on every lambda call.
const KEY_EXPRESSION = /(?<param>\w+)\s*\)?\s*(?:=>\s*(?:\{\s*return\s+)?|\{[\s\S]*?\breturn\s+)\k<param>\.(?<key>[\w$.-]+)/;

export interface LocaleNamespace<TModel = any> {
	t(expr: string | ((loc: TModel) => string), ...args: []): string;
	t(expr: string | ((loc: TModel) => string), params: Record<string, any>): string;
}

export class LocaleNamespaceImpl<TModel = any> implements LocaleNamespace<TModel> {
	readonly name: string;
	readonly current: TModel;
	readonly def: TModel;

	private _cache: { [key: string]: string } = {};

	constructor(name: string, current: TModel, def: TModel) {
		if (!name)
			throw new Error("Localization namespace name is required.");

		this.name = name;
		this.current = current;
		this.def = def;
	}

	t(expr: string | ((model: TModel) => string), ...args: []): string;
	t(expr: string | ((model: TModel) => string), params: Record<string, any>): string;
	t(expr: string | ((model: TModel) => string), ...args: any[]): string {
		let path: string;
		if (typeof expr === "string")
			path = expr;
		else {
			// If a minifier ever breaks this parsing, the safe path is the string form t("a.b").
			const exprStr = expr.toString();
			const exprResult = KEY_EXPRESSION.exec(exprStr);
			if (!exprResult || !exprResult.groups)
				throw new Error(`Cannot extract localization key from expression: ${exprStr}`);

			path = exprResult.groups.key;
		}

		let value = this._cache[path];
		if (value === undefined) {
			// Only a leaf translation (a string, including an empty one) is valid. A path that
			// points to an intermediate node (object) or is missing counts as "not found".
			// Fall back to the default language; when the languages match, def === current
			// and the second lookup is harmless.
			let resolved = ObjectHelper.getProperty(this.current, path);
			if (typeof resolved !== "string")
				resolved = ObjectHelper.getProperty(this.def, path);

			value = typeof resolved === "string" ? resolved : path;
			this._cache[path] = value;
		}

		return formatText(value, ...args);
	}
}

export interface LocalizationBuilder<TLang extends string, TModel> {
	/** Registers a dictionary loader for the language. A loader is invoked only for the current and the default language. */
	add(lang: TLang, loader: () => Promise<TModel>): this;
}

class LocalizationBuilderImpl<TLang extends string, TModel> implements LocalizationBuilder<TLang, TModel> {
	readonly langs: { [key: string]: () => Promise<TModel> } = {};

	add(lang: TLang, loader: () => Promise<TModel>): this {
		this.langs[lang] = loader;

		return this;
	}

	async load(lang: TLang): Promise<TModel | null> {
		const loader = this.langs[lang];
		if (!loader)
			return null;

		return await loader();
	}
}

export interface I18nOptions<TLang extends string> {
	/** Raw language value, e.g. document.documentElement.lang. A region ("ar-SA") is reduced to the base language. */
	lang: string | null | undefined;
	/** Supported languages. A value outside the list resolves to default. */
	supported: readonly TLang[];
	/** Default language (fallback for translations and for an unrecognized lang). */
	default: TLang;
	/** Right-to-left languages (for IS_RTL). */
	rtl?: readonly TLang[];
}

export interface I18n<TLang extends string> {
	/** Resolved current language from options.lang (validated against supported). */
	readonly CURRENT_LANG: TLang;
	/** true when CURRENT_LANG is listed in options.rtl. */
	readonly IS_RTL: boolean;
	/** Registers a localization namespace and loads the dictionaries of the current and default languages. */
	buildLocalization<TModel>(name: string, configure: (builder: LocalizationBuilder<TLang, TModel>) => void): Promise<LocaleNamespace<TModel>>;
}

export function createI18n<TLang extends string>(options: I18nOptions<TLang>): I18n<TLang> {
	const supported = options.supported;
	const defaultLang = options.default;
	const rtl = options.rtl ?? [];

	const resolveLang = (raw: string | null | undefined): TLang => {
		// document.documentElement.lang returns "" (not null) when the attribute is missing,
		// hence || instead of ??; the region part is dropped.
		const lang = (raw || "").toLowerCase().split("-")[0];
		return (supported as readonly string[]).includes(lang) ? <TLang>lang : defaultLang;
	};

	const CURRENT_LANG = resolveLang(options.lang);
	const IS_RTL = (rtl as readonly string[]).includes(CURRENT_LANG);
	const IS_DIFF_LANG = CURRENT_LANG !== defaultLang;

	// The pending promise is stored, not the namespace itself: loading is asynchronous and two
	// parallel calls with the same name would otherwise both pass the check and build two namespaces.
	const namespaces: { [key: string]: Promise<LocaleNamespace<any>> | undefined } = {};

	function buildLocalization<TModel>(name: string, configure: (builder: LocalizationBuilder<TLang, TModel>) => void): Promise<LocaleNamespace<TModel>> {
		if (namespaces[name])
			return Promise.reject(new Error(`Localization namespace ${name} already registered.`));

		const load = async (): Promise<LocaleNamespace<TModel>> => {
			const builder = new LocalizationBuilderImpl<TLang, TModel>();
			configure(builder);

			const current = await builder.load(CURRENT_LANG);
			const def = IS_DIFF_LANG ? await builder.load(defaultLang) : current;
			if (!def)
				throw new Error(`Not found default localization for namespace "${name}" (language "${defaultLang}").`);

			// current may be missing (no loader for the current language); then the default dictionary is used.
			return new LocaleNamespaceImpl<TModel>(name, current ?? def, def);
		};

		// A failed build is not cached, so the caller can retry with a fixed configuration.
		const promise = load().catch(error => { delete namespaces[name]; throw error; });

		return namespaces[name] = promise;
	}

	return { CURRENT_LANG, IS_RTL, buildLocalization };
}
