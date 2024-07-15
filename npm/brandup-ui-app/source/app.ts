import { UIElement } from "brandup-ui";
import { EnvironmentModel, ApplicationModel, NavigationOptions, NavigationStatus, SubmitOptions } from "./typings/app";
import { LoadContext, Middleware, NavigateContext, StartContext, StopContext, SubmitContext } from "./middleware";
import { MiddlewareInvoker } from "./invoker";

export const FormClassName = "appform";
export const LoadingElementClass = "loading";
export const NavUrlClassName = "applink";
export const NavUrlAttributeName = "data-nav-url";
export const NavUrlReplaceAttributeName = "data-nav-replace";
export const NavIgnoreAttributeName = "data-nav-ignore";

/**
 * Base application class.
 */
export class Application<TModel extends ApplicationModel = {}> extends UIElement {
	readonly env: EnvironmentModel;
	readonly model: TModel;
	private readonly __invoker: MiddlewareInvoker;
	private __isInit = false;
	private __isLoad = false;
	private __isDestroy = false;
	private readonly __clickFunc: (e: MouseEvent) => void;
	private readonly __keyDownUpFunc: (e: KeyboardEvent) => void;
	private readonly __submitFunc: (e: SubmitEvent) => void;
	private _ctrlPressed = false;
	private __loadingCounter = 0;

	private __middlewares: { [key: string]: Middleware<Application<TModel>, TModel> } = {};
	private __middlewaresNames: { [key: string]: string } = {};

	constructor(env: EnvironmentModel, model: TModel, middlewares: Array<Middleware<Application<TModel>, TModel>>) {
		super();

		this.env = env;
		this.model = model;

		this.setElement(document.body);

		const core = new Middleware();
		core.bind(this);
		this.__invoker = new MiddlewareInvoker(core);

		if (middlewares && middlewares.length > 0) {
			middlewares.forEach((m) => {
				m.bind(this);

				var name = m.constructor.name.toLowerCase();
				if (name.endsWith("middleware"))
					name = name.substring(0, name.length - "middleware".length);

				if (this.__middlewares.hasOwnProperty(name))
					throw `Middleware "${name}" already registered.`;

				this.__middlewares[name] = m;
				this.__middlewaresNames[m.constructor.name] = name;

				this.__invoker.next(m);
			});
		}

		this.__clickFunc = (e: MouseEvent) => this.__onClick(e);
		this.__keyDownUpFunc = (e: KeyboardEvent) => this.__onKeyDownUp(e);
		this.__submitFunc = (e: SubmitEvent) => this.__onSubmit(e);
	}

	get typeName(): string { return "Application" }
	get invoker(): MiddlewareInvoker { return this.__invoker; }

	middleware<T extends Middleware<Application<TModel>, TModel>>(c: new () => T): T {
		const name = this.__middlewaresNames[c.name];
		if (!name)
			throw `Middleware ${c.name} is not registered.`;

		return <T>this.__middlewares[name];
	}

	start(callback?: (app: Application) => void) {
		if (this.__isInit)
			return;
		this.__isInit = true;

		console.info("app starting");

		window.addEventListener("click", this.__clickFunc, false);
		window.addEventListener("keydown", this.__keyDownUpFunc, false);
		window.addEventListener("keyup", this.__keyDownUpFunc, false);
		window.addEventListener("submit", this.__submitFunc, false);

		const context: StartContext = {
			items: {}
		};

		this.__invoker.invoke("start", context, () => {
			console.info("app started");

			if (callback)
				callback(this);
		});
	}

	load(callback?: (app: Application) => void) {
		if (!this.__isInit)
			throw "Before executing the load method, you need to execute the init method.";

		if (this.__isLoad)
			return;
		this.__isLoad = true;

		console.info("app loading");

		const context: LoadContext = {
			items: {}
		};

		this.__invoker.invoke("loaded", context, () => {
			console.info("app loaded");

			if (callback)
				callback(this);

			this.endLoadingIndicator();
		});
	}

	nav(options: NavigationOptions) {
		let { url, replace = false, context, callback } = options;

		if (!callback)
			callback = () => { };

		if (!context)
			context = {};

		let path: string;
		let query: URLSearchParams | null = null;
		let hash: string | null = null;
		if (!url) {
			path = location.pathname;
			if (location.search)
				query = new URLSearchParams(location.search);
			if (location.hash)
				hash = location.hash;
		}
		else {
			if (url.startsWith("#")) {
				path = location.pathname;
				if (location.search)
					query = new URLSearchParams(location.search);
				hash = url;
			}
			else if (url.startsWith("?")) {
				path = location.pathname;
				query = new URLSearchParams(url);
			}
			else {
				if (url.startsWith("http")) {
					// Если адрес абсолютный

					const currentBaseUrl = `${location.protocol}//${location.host}`;
					if (!url.startsWith(currentBaseUrl)) {
						// Если домен и протокол отличается от текущего, то перезагружаем страницу

						callback({ status: "External", context });

						location.href = url;
						return;
					}

					url = url.substring(currentBaseUrl.length);
				}

				const hashIndex = url.lastIndexOf("#");
				if (hashIndex > 0) {
					hash = url.substring(hashIndex);
					url = url.substring(0, hashIndex);
				}

				const qyeryIndex = url.indexOf("?");
				if (qyeryIndex > 0) {
					query = new URLSearchParams(url.substring(qyeryIndex + 1));
					url = url.substring(0, qyeryIndex);
				}
				else
					query = new URLSearchParams();

				path = url;
			}
		}

		if (hash === "#")
			hash = null;

		if (options.query) {
			if (!query)
				query = new URLSearchParams();

			for (let key in options.query) {
				const value = options.query[key];
				if (!Array.isArray(value)) {
					query.set(key, value);
				}
				else {
					query.delete(key);
					value.forEach(val => query?.append(key, val));
				}
			}
		}

		// Собираем полный адрес без домена

		let fullUrl = path;
		let queryStr: string | null = null;
		if (query && query.size) {
			queryStr = query.toString();
			fullUrl += "?" + queryStr;
		}
		if (hash) {
			fullUrl += hash;
			hash = hash.substring(1);
		}

		try {
			console.info(`app navigate: ${fullUrl}`);

			this.beginLoadingIndicator();

			const queryDict: { [key: string]: Array<string> } = {};
			query?.forEach((v, k) => {
				if (!queryDict[k])
					queryDict[k] = [v];
				else
					queryDict[k].push(v);
			});

			const navContext: NavigateContext = {
				items: {},
				url: fullUrl,
				path,
				query: queryStr,
				queryParams: queryDict,
				hash,
				replace,
				context
			};

			console.info(navContext);

			this.__invoker.invoke("navigate", navContext, () => {
				callback({ status: "Success", context });
				this.endLoadingIndicator();
			});
		}
		catch (e) {
			console.error("navigation error");
			console.error(e);

			callback({ status: "Error", context });
			this.endLoadingIndicator();
		}
	}

	submit(options: SubmitOptions) {
		const { form, button = null } = options;
		let { context, callback } = options;

		if (form.classList.contains(LoadingElementClass))
			return false;
		form.classList.add(LoadingElementClass);

		if (button)
			button.classList.add(LoadingElementClass);

		if (!callback)
			callback = () => { };

		if (!context)
			context = {};

		let method = form.method;
		let enctype = form.enctype;
		let url = form.action;

		if (button) {
			// Если отправка с кнопки, то берём её параметры
			if (button.hasAttribute("formmethod"))
				method = button.formMethod;
			if (button.hasAttribute("formenctype"))
				enctype = button.formEnctype;
			if (button.hasAttribute("formaction"))
				url = button.formAction;
		}

		const urlHashIndex = url.lastIndexOf("#");
		if (urlHashIndex > 0)
			url = url.substring(0, urlHashIndex);

		console.info(`form sibmiting: ${method.toUpperCase()} ${url}`);

		const complexCallback = () => {
			form.classList.remove(LoadingElementClass);

			if (button)
				button.classList.remove(LoadingElementClass);

			callback({ context });

			this.endLoadingIndicator();

			console.info(`form sibmited`);
		};

		if (method.toLowerCase() === "get") {
			const formData = new FormData(form);
			const queryParams: { [key: string]: string | string[] } = {};
			formData.forEach((v, k) => {
				if (queryParams[k])
					(<string[]>queryParams[k]).push(v.toString());
				else
					queryParams[k] = [v.toString()];
			});

			this.nav({
				url,
				query: queryParams,
				replace: form.hasAttribute(NavUrlReplaceAttributeName),
				context: context,
				callback: complexCallback
			});

			return;
		}

		this.beginLoadingIndicator();

		var submitContext: SubmitContext = {
			form,
			button,
			method,
			enctype,
			url,
			items: {},
			context
		}

		this.__invoker.invoke("submit", submitContext, complexCallback);
	}

	reload() {
		this.nav({ url: null, replace: true });
	}

	destroy(callback?: (app: Application) => void) {
		if (this.__isDestroy)
			return;
		this.__isDestroy = true;

		console.info("app destroing");

		window.removeEventListener("click", this.__clickFunc, false);
		window.removeEventListener("keydown", this.__keyDownUpFunc, false);
		window.removeEventListener("keyup", this.__keyDownUpFunc, false);
		window.removeEventListener("submit", this.__submitFunc, false);

		const context: StopContext = {
			items: {}
		};

		this.__invoker.invoke("stop", context, () => {
			console.info("app stopped");

			if (callback)
				callback(this);
		});
	}

	/**
	 * Generate url of application base url.
	 * @param path Add optional path of base url.
	 * @param queryParams Add optional query params.
	 * @param hash Add optional hash.
	 * @returns Relative url with base path.
	 */
	uri(path?: string, queryParams?: { [key: string]: string }, hash?: string): string {
		let url = this.env.basePath;
		if (path) {
			if (path.startsWith("/"))
				path = path.substring(1);
			url += path;
		}

		if (queryParams) {
			const query = new URLSearchParams();
			for (const key in queryParams) {
				const value = queryParams[key];
				if (value === null || typeof value === "undefined")
					continue;

				query.set(key, value);
			}

			if (query.size)
				url += "?" + query.toString();
		}

		if (hash) {
			if (!hash.startsWith("#"))
				hash = "#" + hash;

			if (hash != "#")
				url += hash;
		}

		return url;
	}

	private __onClick(e: MouseEvent) {
		let elem: HTMLElement | null = e.target as HTMLElement;
		let ignore = false;
		while (elem) {
			if (elem.hasAttribute(NavIgnoreAttributeName)) {
				ignore = true;
				break;
			}

			if (elem.classList && elem.classList.contains(NavUrlClassName))
				break;

			if (elem === e.currentTarget)
				return;

			elem = elem.parentElement;
		}

		if (!elem || this._ctrlPressed || elem.getAttribute("target") === "_blank")
			return;

		e.preventDefault();
		e.stopPropagation();

		if (ignore)
			return;

		let url: string | null;
		if (elem.tagName === "A")
			url = elem.getAttribute("href");
		else if (elem.hasAttribute(NavUrlAttributeName))
			url = elem.getAttribute(NavUrlAttributeName);
		else
			throw "Не удалось получить Url адрес для перехода.";

		if (elem.classList.contains(LoadingElementClass))
			return;
		elem.classList.add(LoadingElementClass);

		this.nav({
			url,
			replace: elem.hasAttribute(NavUrlReplaceAttributeName),
			callback: () => { elem.classList.remove(LoadingElementClass); }
		});

		return;
	}
	private __onKeyDownUp(e: KeyboardEvent) {
		this._ctrlPressed = e.ctrlKey;
	}
	private __onSubmit(e: SubmitEvent) {
		const form = e.target as HTMLFormElement;
		if (!form.classList.contains(FormClassName))
			return;

		e.preventDefault();

		this.submit({ form, button: e.submitter instanceof HTMLButtonElement ? <HTMLButtonElement>e.submitter : null });
	}

	beginLoadingIndicator() {
		this.__loadingCounter++;

		document.body.classList.remove("bp-state-loaded");
		document.body.classList.add("bp-state-loading");
	}

	endLoadingIndicator() {
		this.__loadingCounter--;
		if (this.__loadingCounter < 0)
			this.__loadingCounter = 0;

		if (this.__loadingCounter <= 0) {
			document.body.classList.remove("bp-state-loading");
			document.body.classList.add("bp-state-loaded");
		}
	}
}