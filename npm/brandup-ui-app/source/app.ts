import { UIElement } from "brandup-ui";
import { EnvironmentModel, ApplicationModel, NavigationOptions, SubmitOptions } from "./typings/app";
import { LoadContext, Middleware, NavigateContext, StartContext, StopContext, SubmitContext } from "./middleware";
import { MiddlewareInvoker } from "./invoker";
import urlHelper from "./helpers/url";

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
	get invoker(): MiddlewareInvoker { return this.__invoker; }

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

	middleware<T extends Middleware<Application<TModel>, TModel>>(c: new () => T): T {
		const name = this.__middlewaresNames[c.name];
		if (!name)
			throw `Middleware ${c.name} is not registered.`;

		return <T>this.__middlewares[name];
	}

	start(callback?: (app: Application) => void) {
		if (this.__isStarted)
			return;
		this.__isStarted = true;

		console.info("app starting");

		this.setElement(document.body);

		window.addEventListener("click", this.__clickFunc, false);
		window.addEventListener("keydown", this.__keyDownUpFunc, false);
		window.addEventListener("keyup", this.__keyDownUpFunc, false);
		window.addEventListener("submit", this.__submitFunc, false);

		const context: StartContext = { context: {} };

		this.__invoker.invoke("start", context, () => {
			console.info("app started");

			if (callback)
				callback(this);
		});
	}

	load(callback?: (app: Application) => void) {
		if (!this.__isStarted)
			throw "Before executing the load method, you need to execute the init method.";

		if (this.__isLoad)
			return;
		this.__isLoad = true;

		console.info("app loading");

		const context: LoadContext = { context: {} };

		this.__invoker.invoke("loaded", context, () => {
			console.info("app loaded");

			if (callback)
				callback(this);

			this.endLoadingIndicator();
		});
	}

	nav(options: NavigationOptions) {
		let { url = null, replace = false, context = {}, callback = () => { } } = options;

		const navUrl = urlHelper.parseUrl(url);

		if (options.query)
			urlHelper.extendQuery(navUrl, options.query);

		console.info(`app navigate: ${navUrl.full}`);

		try {
			this.beginLoadingIndicator();

			const navContext: NavigateContext = {
				source: "nav",
				context,
				url: navUrl.full,
				origin: navUrl.origin,
				path: navUrl.path,
				query: navUrl.query,
				hash: navUrl.hash,
				replace,
				external: navUrl.external
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
		const { form, button = null, context = {}, callback = () => { } } = options;

		if (!form.checkValidity)
			return;

		if (form.classList.contains(LoadingElementClass))
			return false;
		form.classList.add(LoadingElementClass);

		if (button)
			button.classList.add(LoadingElementClass);

		let method = form.method;
		let enctype = form.enctype;
		let url = form.action;
		let replace = form.hasAttribute(NavUrlReplaceAttributeName);

		if (button) {
			// Если отправка с кнопки, то берём её параметры
			if (button.hasAttribute("formmethod"))
				method = button.formMethod;
			if (button.hasAttribute("formenctype"))
				enctype = button.formEnctype;
			if (button.hasAttribute("formaction"))
				url = button.formAction;
			if (button.hasAttribute(NavUrlReplaceAttributeName))
				replace = true;
		}

		const navUrl = urlHelper.parseUrl(url);

		if (options.query)
			urlHelper.extendQuery(navUrl, options.query);

		console.info(`form ${method} to ${navUrl.full}`);

		const complexCallback = () => {
			form.classList.remove(LoadingElementClass);

			if (button)
				button.classList.remove(LoadingElementClass);

			callback({ status: "Success", context });

			this.endLoadingIndicator();

			console.info(`form ${method}`);
		};

		this.beginLoadingIndicator();

		if (method.toLowerCase() === "get") {
			urlHelper.extendQuery(navUrl, new FormData(form));

			let submitContext: SubmitContext = {
				source: "form",
				context,
				form,
				button,
				method,
				enctype,
				url: navUrl.full,
				origin: navUrl.origin,
				path: navUrl.path,
				query: navUrl.query,
				hash: navUrl.hash,
				replace: replace,
				external: navUrl.external
			};

			try {
				this.__invoker.invoke("navigate", submitContext, complexCallback);
			}
			catch (e) {
				console.error(`form ${method} error`);
				console.error(e);

				callback({ status: "Error", context });
				this.endLoadingIndicator();
			}
		}
		else {
			let submitContext: SubmitContext = {
				source: "form",
				context,
				form,
				button,
				method,
				enctype,
				url: navUrl.full,
				origin: navUrl.origin,
				path: navUrl.path,
				query: navUrl.query,
				hash: navUrl.hash,
				replace: replace,
				external: navUrl.external
			};

			try {
				this.__invoker.invoke("submit", submitContext, complexCallback);
			}
			catch (e) {
				console.error(`form ${method} error`);
				console.error(e);

				callback({ status: "Error", context });
				this.endLoadingIndicator();
			}
		}
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
			context: {}
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

		this.nav({
			url,
			replace: elem.hasAttribute(NavUrlReplaceAttributeName),
			callback: () => { elem.classList.remove(LoadingElementClass); }
		});
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