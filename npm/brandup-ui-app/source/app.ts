import { UIElement } from "brandup-ui";
import { EnvironmentModel, ApplicationModel, NavigationOptions, SubmitOptions, ContextData } from "./typings/app";
import { LoadContext, Middleware, NavigateContext, StartContext, StopContext, SubmitContext, NavigateSource, SubmitMethod } from "./middleware";
import { MiddlewareInvoker } from "./invoker";
import urlHelper, { ParsedUrl } from "./helpers/url";

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
	private readonly __clickFunc: (e: MouseEvent) => void;
	private readonly __keyDownUpFunc: (e: KeyboardEvent) => void;
	private readonly __submitFunc: (e: SubmitEvent) => void;
	private __isInitialized = false;
	private __isStarted = false;
	private __isLoad = false;
	private __isDestroy = false;
	private __ctrlPressed = false;
	private __loadingCounter = 0;

	private __middlewares: { [key: string]: Middleware<Application<TModel>, TModel> } = {};
	private __middlewaresNames: { [key: string]: string } = {};

	constructor(env: EnvironmentModel, model: TModel) {
		super();

		this.env = env;
		this.model = model;

		this.__clickFunc = (e: MouseEvent) => this.__onClick(e);
		this.__keyDownUpFunc = (e: KeyboardEvent) => this.__onKeyDownUp(e);
		this.__submitFunc = (e: SubmitEvent) => this.__onSubmit(e);

		const core = new Middleware();
		core.bind(this);
		this.__invoker = new MiddlewareInvoker(core);
	}

	get typeName(): string { return "Application" }

	/** Middleware methods invoker. */
	get invoker(): MiddlewareInvoker { return this.__invoker; }

	/**
	 * @param middlewares Initialize application with middlewares. Using in ApplicationBuilder.
	 */
	initialize(middlewares: Array<Middleware<Application<TModel>, TModel>>) {
		if (this.__isInitialized)
			throw 'Application already initialized.';
		this.__isInitialized = true;

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

	/**
	 * Get middleware by type.
	 * @param type Type of middleware.
	 * @returns Middleware instance.
	 */
	middleware<T extends Middleware<Application<TModel>, TModel>>(type: new () => T): T {
		const name = this.__middlewaresNames[type.name];
		if (!name)
			throw `Middleware ${type.name} is not registered.`;

		return <T>this.__middlewares[name];
	}

	/**
	 * Run application.
	 * @param contextData Run context data.
	 * @param element HTMLElement of application. Default is document.body.
	 * @returns Promise of runned result.
	 */
	run(contextData?: ContextData | null, element?: HTMLElement): Promise<ContextData> {
		if (!contextData)
			contextData = {};

		this.setElement(element || document.body);
		this.beginLoadingIndicator();

		var result = this.__start(contextData)
			.then(data => this.__load(data))
			.then(data => {
				const navUrl = urlHelper.parseUrl(null);
				return this.__nav(navUrl, "first", data, false);
			});

		result
			.catch(reason => console.error(`Unable to run application with reason: ${reason}`))
			.finally(() => this.endLoadingIndicator());

		return result;
	}

	/**
	 * Navigate application to url.
	 * @param options Navigate options.
	 * @returns Promise of navigated result.
	 */
	nav(options: NavigationOptions): Promise<ContextData> {
		let { url = null, replace = false, context = {}, callback = null } = options;

		const navUrl = urlHelper.parseUrl(url);
		if (options.query)
			urlHelper.extendQuery(navUrl, options.query);

		var result = this.__nav(navUrl, "nav", context, replace);
		result
			.then(() => {
				if (callback)
					callback({ status: "Success", context });
			})
			.catch(() => {
				if (callback)
					callback({ status: "Error", context });
			});

		return result;
	}

	/**
	 * Submit application form.
	 * @param options Submit options.
	 * @returns Promise of submitted result.
	 */
	submit(options: SubmitOptions): Promise<ContextData> {
		const { form, button = null, context = {}, callback = null } = options;

		if (!form.checkValidity)
			return Promise.reject('Form is invalid.');

		if (form.classList.contains(LoadingElementClass))
			return form["_submit_"];
		form.classList.add(LoadingElementClass);

		if (button)
			button.classList.add(LoadingElementClass);

		this.beginLoadingIndicator();

		let method = form.method;
		let enctype = form.enctype;
		let url = form.action;
		let replace = form.hasAttribute(NavUrlReplaceAttributeName);

		if (button) {
			// Get button patameters for request
			if (button.hasAttribute("formmethod"))
				method = button.formMethod;
			if (button.hasAttribute("formenctype"))
				enctype = button.formEnctype;
			if (button.hasAttribute("formaction"))
				url = button.formAction;

			if (button.hasAttribute(NavUrlReplaceAttributeName))
				replace = true;
		}

		method = method.toUpperCase();

		const navUrl = urlHelper.parseUrl(url);

		if (options.query)
			urlHelper.extendQuery(navUrl, options.query);

		let result: Promise<ContextData>;

		if (method === "GET") {
			urlHelper.extendQuery(navUrl, new FormData(form));

			result = this.__nav(navUrl, "submit", context, replace);
		}
		else {
			console.info(`submit ${method} begin ${navUrl.full}`);

			let submitContext: SubmitContext = {
				source: "submit",
				data: context,
				form,
				button,
				method: method,
				enctype,
				url: navUrl.full,
				origin: navUrl.origin,
				path: navUrl.path,
				query: navUrl.query,
				hash: navUrl.hash,
				replace: replace,
				external: navUrl.external
			};

			result = this.__invoker.invoke("submit", submitContext);
		}

		result
			.then((data) => {
				console.info(`submit ${method} success ${navUrl.full}`)

				if (callback)
					callback({ status: "Success", context });

				return data;
			})
			.catch(reason => {
				console.error(`submit ${method} error ${navUrl.full} reason: ${reason}`)

				if (callback)
					callback({ status: "Error", context });
			})
			.finally(() => {
				delete form["_submit_"];

				form.classList.remove(LoadingElementClass);

				if (button)
					button.classList.remove(LoadingElementClass);

				this.endLoadingIndicator();
			});

		form["_submit_"] = result;

		return result;
	}

	/**
	 * Reload page with nav.
	 */
	reload() {
		this.nav({ url: null, replace: true });
	}

	/**
	 * Global reload page in browser.
	 */
	restart() {
		location.reload();
	}

	destroy(): Promise<ContextData> {
		if (this.__isDestroy)
			return Promise.reject('Application already destroyed.');
		this.__isDestroy = true;

		console.info("app destroy begin");

		window.removeEventListener("click", this.__clickFunc, false);
		window.removeEventListener("keydown", this.__keyDownUpFunc, false);
		window.removeEventListener("keyup", this.__keyDownUpFunc, false);
		window.removeEventListener("submit", this.__submitFunc, false);

		const context: StopContext = {
			data: {}
		};

		const stopResult = this.__invoker.invoke("stop", context);

		stopResult
			.then(data => console.info("app destroy success"))
			.catch(reason => console.error(`app destroy error: ${reason}`));

		return stopResult;
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

	/** Start middlewares. */
	private __start(contextData: ContextData): Promise<ContextData> {
		if (this.__isStarted)
			throw 'Application already started.';
		this.__isStarted = true;

		const context: StartContext = { data: contextData };
		const startResult = this.__invoker.invoke("start", context);

		startResult
			.then(() => {
				console.info("app start success");

				window.addEventListener("click", this.__clickFunc, false);
				window.addEventListener("keydown", this.__keyDownUpFunc, false);
				window.addEventListener("keyup", this.__keyDownUpFunc, false);
				window.addEventListener("submit", this.__submitFunc, false);
			})
			.catch(reason => console.error(`app start error: ${reason}`));

		return startResult;
	}

	/** Loaded middlewares. */
	private __load(contextData: ContextData): Promise<ContextData> {
		if (!this.__isStarted)
			throw "Before executing the load method, you need to execute the init method.";

		if (this.__isLoad)
			throw 'Application already loaded.';
		this.__isLoad = true;

		const context: LoadContext = { data: contextData };
		const loadResult = this.__invoker.invoke("loaded", context);

		loadResult
			.then(() => console.info("app load success"))
			.catch(reason => console.error(`app load error: ${reason}`));

		return loadResult;
	}

	private __nav(navUrl: ParsedUrl, source: NavigateSource, contextData: ContextData, replace: boolean): Promise<ContextData> {
		console.info(`app nav begin ${navUrl.full}`);

		const context: NavigateContext = {
			source,
			data: contextData,
			url: navUrl.full,
			origin: navUrl.origin,
			path: navUrl.path,
			query: navUrl.query,
			hash: navUrl.hash,
			replace,
			external: navUrl.external
		};

		console.info(context);

		this.beginLoadingIndicator();

		const navResult = this.__invoker.invoke("navigate", context);

		navResult
			.then(() => console.info(`app nav success ${navUrl.full}`))
			.catch(reason => console.error(`app nav error ${navUrl.full}: ${reason}`))
			.finally(() => this.endLoadingIndicator());

		return navResult;
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

		if (!elem || this.__ctrlPressed || elem.getAttribute("target") === "_blank")
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
			throw "Not found url for navigation.";

		if (elem.classList.contains(LoadingElementClass))
			return;
		elem.classList.add(LoadingElementClass);

		this.nav({ url, replace: elem.hasAttribute(NavUrlReplaceAttributeName), context: { clickElem: elem } })
			.finally(() => elem.classList.remove(LoadingElementClass));
	}

	private __onKeyDownUp(e: KeyboardEvent) {
		this.__ctrlPressed = e.ctrlKey;
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