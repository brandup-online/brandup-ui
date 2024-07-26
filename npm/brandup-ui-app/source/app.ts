import { UIElement } from "@brandup/ui";
import { EnvironmentModel, ApplicationModel, QueryParams } from "./types";
import { Middleware, StartContext, StopContext, NavigateContext, SubmitContext, InvokeContext, ContextData } from "./middlewares/base";
import { MiddlewareInvoker } from "./middlewares/invoker";
import StateMiddleware from "./middlewares/state";
import HyperLinkMiddleware from "./middlewares/hyperlink";
import urlHelper from "./helpers/url";
import BROWSER from "./browser";
import CONSTANTS from "./constants";

export const NAV_OVERIDE_ERROR = "NavigationOveride";

/**
 * Base application class.
 */
export class Application<TModel extends ApplicationModel = ApplicationModel> extends UIElement {
	/** Application environment. */
	readonly env: EnvironmentModel;
	/** Application model. */
	readonly model: TModel;
	/** Application middleware invoker. */
	readonly invoker: MiddlewareInvoker;
	private __isInitialized = false;
	private __isDestroy = false;
	private __middlewares: { [key: string]: Middleware } = {};
	private __globalSubmit?: (e: SubmitEvent) => void;
	private __execNav?: ExecuteNav<TModel>; // current navigation invoking
	private __lastNav?: ExecuteNav<TModel>; // last success navigation

	constructor(env: EnvironmentModel, model: TModel, ...args: any[]) {
		super();

		this.env = env;
		this.model = model;

		const core: Middleware = { name: "app-root" };
		this.invoker = new MiddlewareInvoker(core);
	}

	get typeName(): string { return "Application" }

	/** @internal */
	initialize(middlewares: Array<Middleware>) {
		if (this.__isInitialized)
			throw new Error('Application already initialized.');
		this.__isInitialized = true;

		this.onInitialize();

		middlewares.forEach(middleware => {
			var name = middleware.name;

			if (this.__middlewares.hasOwnProperty(name))
				throw new Error(`Middleware "${name}" already registered.`);

			this.__middlewares[name] = middleware;

			this.invoker.next(middleware);
		});
	}

	protected onInitialize() {
		this.invoker.next(StateMiddleware());
		this.invoker.next(HyperLinkMiddleware());
	}

	/**
	 * Get middleware by type.
	 * @param type Type of middleware.
	 * @returns Middleware instance.
	 */
	middleware<T extends Middleware>(name: string): T {
		const middleware: any = this.__middlewares[name];
		if (!middleware)
			throw new Error(`Middleware ${name} is not registered.`);

		return <T>middleware;
	}

	/**
	 * Run application.
	 * @param contextData Run context data.
	 * @param element HTMLElement of application. Default is document.body.
	 * @returns Promise of runned result.
	 */
	async run<TData extends ContextData>(contextData?: TData | null, element?: HTMLElement): Promise<StartContext<this, TData>> {
		if (!contextData)
			contextData = <TData>{};

		this.setElement(element || BROWSER.body);

		const abort = new AbortController();

		const context: StartContext<this, TData> = {
			abort: abort.signal,
			app: this,
			data: contextData
		};

		try {
			await this.invoker.invoke("start", context);
			console.info("app start success");

			abort.signal.throwIfAborted();

			BROWSER.window.addEventListener("submit", this.__globalSubmit = (e: SubmitEvent) => {
				const form = e.target as HTMLFormElement;
				if (!form.classList.contains(CONSTANTS.FormClassName))
					return;

				e.preventDefault();

				this.__onSubmit({ form, button: e.submitter instanceof HTMLButtonElement ? <HTMLButtonElement>e.submitter : null })
					.catch(() => { });
			}, false);

			await this.invoker.invoke("loaded", context);
			console.info("app load success");

			abort.signal.throwIfAborted();

			console.info("app runned");

			await this.nav({ data: context.data });

			return context;
		}
		catch (reason: any) {
			if (reason === NAV_OVERIDE_ERROR) {
				console.info(`app run nav overided`);
				return context;
			}

			if (this.__globalSubmit)
				BROWSER.window.removeEventListener("submit", this.__globalSubmit);

			console.error(`app run error: ${reason}`);
			throw reason;
		}
	}

	/**
	 * Navigate application to url.
	 * @param options Navigate options.
	 * @returns Promise of navigated result.
	 */
	async nav<TData extends ContextData>(options?: NavigationOptions<TData> | string | null): Promise<NavigateContext<this, TData>> {
		const opt: NavigationOptions<TData> = (!options || typeof options === "string") ? { url: <string>options } : <NavigationOptions<TData>>options;
		let { url = null, replace = false, data = <TData>{} } = opt;

		const navUrl = urlHelper.parseUrl(url);
		if (opt.query)
			urlHelper.extendQuery(navUrl, opt.query);

		let isFirst = !this.__lastNav && !this.__execNav;

		let parentNav: ExecuteNav<TModel> | undefined;
		if (this.__execNav && this.__execNav.status === "work") {
			parentNav = this.__execNav;

			parentNav.abort.abort(NAV_OVERIDE_ERROR);
			(<any>parentNav.context).overided = true;
		}

		const abort = new AbortController();
		const externalAbort = opt.abort;
		if (externalAbort)
			externalAbort.addEventListener("abort", () => abort.abort(externalAbort.reason));

		const context: NavigateContext<this, TData> = {
			source: isFirst ? "first" : "nav",
			app: this,
			abort: abort.signal,
			current: <NavigateContext<this, TData>>this.__lastNav?.context,
			parent: <NavigateContext<this, TData>>parentNav?.context,
			overided: false,
			data,
			url: navUrl.url,
			origin: navUrl.origin,
			pathAndQuery: navUrl.relative,
			path: navUrl.path,
			query: navUrl.query,
			hash: navUrl.hash,
			external: navUrl.external,
			replace
		};

		const currentNav: ExecuteNav<TModel> = { id: parentNav ? parentNav.id + 1 : 1, method: "navigate", context, abort, status: "work" };
		await this.__execNavigate(currentNav);

		return context;
	}

	private async __onSubmit<TData extends ContextData>(options: SubmitOptions<TData> | HTMLFormElement) {
		const opt: SubmitOptions<TData> = options instanceof HTMLFormElement ? { form: <HTMLFormElement>options } : <SubmitOptions<TData>>options;
		const { form, button = null, query, data = <TData>{} } = opt;

		if (!form.checkValidity())
			return Promise.reject(new Error('Form is invalid.'));

		let replace = form.hasAttribute(CONSTANTS.NavUrlReplaceAttributeName);
		let method = form.method;
		let enctype = form.enctype;
		let url = form.action;

		if (button) {
			if (button.hasAttribute("formmethod"))
				method = button.formMethod;
			if (button.hasAttribute("formenctype"))
				enctype = button.formEnctype;
			if (button.hasAttribute("formaction"))
				url = button.formAction;

			button.classList.add(CONSTANTS.LoadingElementClass);

			if (button.hasAttribute(CONSTANTS.NavUrlReplaceAttributeName))
				replace = true;
		}

		if (form.classList.contains(CONSTANTS.LoadingElementClass))
			return Promise.reject(new Error('Form already submitting.'));
		form.classList.add(CONSTANTS.LoadingElementClass);

		method = method.toUpperCase();

		try {

			if (method === "GET")
				await this.nav({ url, query: new FormData(form), data: data, replace });
			else {
				const navUrl = urlHelper.parseUrl(url);
				if (query)
					urlHelper.extendQuery(navUrl, query);

				let parentNav: ExecuteNav<TModel> | undefined;
				if (this.__execNav && this.__execNav.status === "work") {
					parentNav = this.__execNav;

					parentNav.abort.abort(NAV_OVERIDE_ERROR);
					(<any>parentNav.context).overided = true;
				}

				const abort = new AbortController();
				const externalAbort = opt.abort;
				if (externalAbort)
					externalAbort.addEventListener("abort", () => abort.abort(externalAbort.reason));

				let context: SubmitContext<this, TData> = {
					source: "submit",
					app: this,
					abort: abort.signal,
					current: <NavigateContext<this, TData>>this.__lastNav?.context,
					parent: <NavigateContext<this, TData>>parentNav?.context,
					overided: false,
					data,
					form,
					button,
					method,
					enctype,
					url: navUrl.url,
					origin: navUrl.origin,
					pathAndQuery: navUrl.relative,
					path: navUrl.path,
					query: navUrl.query,
					hash: navUrl.hash,
					external: navUrl.external,
					replace
				};

				const currentNav: ExecuteNav<TModel> = { id: parentNav ? parentNav.id + 1 : 1, method: "submit", context, abort, status: "work" };
				await this.__execNavigate(currentNav);
			}
		}
		finally {
			form.classList.remove(CONSTANTS.LoadingElementClass);

			if (button)
				button.classList.remove(CONSTANTS.LoadingElementClass);
		}
	}

	/**
	 * Reload page with nav.
	 */
	reload() {
		return this.nav({ replace: true });
	}

	/**
	 * Global reload page in browser.
	 */
	restart() {
		BROWSER.reload();
	}

	async destroy<TData extends ContextData = ContextData>(contextData?: TData | null): Promise<StopContext<Application, TData>> {
		if (this.__isDestroy)
			return Promise.reject('Application already destroyed.');
		this.__isDestroy = true;

		console.info("app destroy begin");

		if (this.__globalSubmit)
			BROWSER.window.removeEventListener("submit", this.__globalSubmit);

		if (this.__execNav)
			this.__execNav.abort.abort();

		const abort = new AbortController();

		const context: StopContext<Application, TData> = {
			abort: abort.signal,
			app: this,
			data: contextData || <TData>{}
		};

		try {
			await this.invoker.invoke("stop", context);

			console.info("app destroy success");

			return context;
		}
		catch (reason) {
			console.error(`app destroy error: ${reason}`);
			throw reason;
		}
		finally {
			super.destroy();
		}
	}

	/**
	 * Generate url of application base url.
	 * @param path Add optional path of base url.
	 * @param query Add optional query params.
	 * @param hash Add optional hash.
	 * @returns Relative url with base path.
	 */
	buildUrl(path?: string, query?: QueryParams | URLSearchParams | FormData, hash?: string): string {
		return urlHelper.buildUrl(this.env.basePath, path, query, hash);
	}

	private async __execNavigate(nav: ExecuteNav<TModel>) {
		this.__execNav = nav;

		try {
			console.info(`${nav.method} begin`, nav.context);

			await this.invoker.invoke(nav.method, nav.context);

			this.__lastNav = nav;

			nav.status = "success";
			console.info(`${nav.method} ${nav.status} ${nav.context.url}`);
		}
		catch (reason: any) {
			if (reason?.name === "AbortError") {
				nav.status = "cancelled";
				console.warn(`${nav.method} ${nav.status} ${nav.context.url}`);
			}
			else if (reason === NAV_OVERIDE_ERROR) {
				nav.status = "overided";
				console.warn(`${nav.method} ${nav.status} ${nav.context.url}`);
			}
			else {
				nav.status = "error";
				console.error(`${nav.method} ${nav.status} ${nav.context.url}: ${reason}`);
			}

			throw reason;
		}
	}
}

export interface NavigationOptions<TData extends ContextData = ContextData> {
	url?: string | null;
	query?: QueryParams | URLSearchParams | FormData;
	replace?: boolean;
	data?: TData;
	abort?: AbortSignal;
}

export interface SubmitOptions<TData extends ContextData = ContextData> {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	query?: QueryParams | URLSearchParams;
	data?: TData;
	abort?: AbortSignal;
}

interface ExecuteNav<TModel extends ApplicationModel = ApplicationModel> {
	id: number;
	method: "navigate" | "submit";
	context: NavigateContext<Application<TModel>, ContextData>;
	abort: AbortController;
	status: ExecuteStatus;
}

type ExecuteStatus = "work" | "success" | "overided" | "cancelled" | "error";