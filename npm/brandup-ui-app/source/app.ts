import { UIElement } from "@brandup/ui";
import { EnvironmentModel, ApplicationModel, QueryParams } from "./types";
import { Middleware, StartContext, StopContext, NavigateContext, SubmitContext, ContextData, SubmitOptions, NavigateOptions, NavigateAction } from "./middlewares/base";
import { MiddlewareInvoker } from "./middlewares/invoker";
import StateMiddleware from "./middlewares/state";
import HyperLinkMiddleware from "./middlewares/hyperlink";
import urlHelper from "./helpers/url";
import CONSTANTS from "./constants";
import { Guid } from "@brandup/ui-helpers";

export const APP_TYPENAME = "brandup-ui-app";
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
	private __abort: AbortController;
	private __isInited?: boolean;
	private __isRuned?: boolean;
	private __middlewares: { [key: string]: Middleware } = {};
	private __globalSubmit?: (e: SubmitEvent) => void;
	private __execNav?: ExecuteNav<this, ContextData>; // current navigation invoking
	private __lastNav?: ExecuteNav<this, ContextData>; // last success navigation

	constructor(env: EnvironmentModel, model: TModel, ...args: any[]) {
		super();

		this.env = env;
		this.model = model;

		const core: Middleware = { name: "app-root" };
		this.invoker = new MiddlewareInvoker(core);
		this.__abort = new AbortController();
	}

	get typeName(): string { return APP_TYPENAME; }
	/** Current navigation context. */
	get current(): NavigateContext<this> | undefined { return this.__lastNav?.context; }
	/** Application destroy signal. */
	get abort(): AbortSignal { return this.__abort.signal; }

	/** @internal */
	initialize(middlewares: Middleware[]) {
		if (this.__isInited)
			throw new Error('Application already initialized.');
		this.__isInited = true;

		this.onInitialize();

		middlewares.forEach(middleware => {
			var name = middleware.name;

			if (this.__middlewares.hasOwnProperty(name))
				throw new Error(`Middleware "${name}" already registered.`);

			this.__middlewares[name] = middleware;

			this.invoker.next(middleware);
		});
	}

	/** Initialize application instance. */
	protected onInitialize() {
		this.invoker.next(StateMiddleware());
		this.invoker.next(HyperLinkMiddleware());
	}

	/** Begin run application. */
	protected onStarting(): Promise<void> { return Promise.resolve(); }

	/** Complate run application. */
	protected onStared(): Promise<void> { return Promise.resolve(); }

	/**
	 * Get middleware by type.
	 * @param type Type of middleware.
	 * @returns Middleware instance.
	 */
	middleware<T extends Middleware>(name: string): T {
		this.__abort.signal.throwIfAborted();

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
		if (this.__abort.signal.aborted)
			throw new Error('Application is destroyed.');

		if (this.__isRuned)
			throw new Error('Application already run.');
		this.__isRuned = true;

		if (!contextData)
			contextData = <TData>{};

		element = element || document.body;
		this.setElement(element);

		const context: StartContext<this, TData> = {
			abort: this.__abort.signal,
			app: this,
			data: contextData
		};

		try {
			await this.onStarting();

			await this.invoker.invoke("start", context);
			console.info("app start success");

			this.__abort.signal.throwIfAborted();

			await this.invoker.invoke("loaded", context);
			console.info("app load success");

			this.__abort.signal.throwIfAborted();

			window.addEventListener("popstate", (e: PopStateEvent) => this.__onPopState(context, e));

			element.addEventListener("submit", this.__globalSubmit = (e: SubmitEvent) => {
				const form = e.target as HTMLFormElement;
				if (!form.classList.contains(CONSTANTS.FormClassName))
					return;

				e.preventDefault();

				this.__onSubmit({ form, button: e.submitter instanceof HTMLButtonElement ? <HTMLButtonElement>e.submitter : null })
					.catch(() => { });
			}, false);

			await this.onStared();

			console.info("app runned");
		}
		catch (reason: any) {
			console.error(`app run error: ${reason}`);
			throw reason;
		}

		try {
			await this.nav({ data: context.data, abort: this.__abort.signal });
		}
		catch (reason: any) {
			if (reason === NAV_OVERIDE_ERROR) {
				console.info(`app run nav overided`);
				return context;
			}

			throw reason;
		}

		return context;
	}

	/**
	 * Navigate application to url.
	 * @param options Navigate options.
	 * @returns Promise of navigated result.
	 */
	async nav<TData extends ContextData>(options?: NavigateOptions<TData> | string | null): Promise<NavigateContext<this, TData>> {
		const opt: NavigateOptions<TData> = (!options || typeof options === "string") ? { url: <string>options } : <NavigateOptions<TData>>options;
		let { url = null, query, replace = false, scope = null, data = <TData>{}, abort } = opt;

		const navUrl = urlHelper.parseUrl(this.env.basePath, url);
		if (query)
			urlHelper.extendQuery(navUrl, query);

		let isFirst = !this.__lastNav && !this.__execNav;
		let action: NavigateAction;
		if (isFirst)
			action = "first";
		else {
			const isChangedUrl = this.__lastNav?.context.url.toLowerCase() !== navUrl.url.toLowerCase();
			const hasHash = !!this.__lastNav?.context.hash || !!navUrl.hash;

			if (isChangedUrl)
				action = "url-change"; // если изменился url
			else
				action = hasHash ? "hash" : "url-no-change";
		}

		let parentNav: ExecuteNav<this, TData> | undefined;
		if (this.__execNav && this.__execNav.status === "work") {
			parentNav = this.__execNav as ExecuteNav<this, TData>;

			parentNav.abort.abort(NAV_OVERIDE_ERROR);
			(<any>parentNav.context).overided = true;
		}

		const navIndex = parentNav ? parentNav.context.index + 1 : 1;

		const navAbort = new AbortController();
		const aborts: AbortSignal[] = [this.__abort.signal, navAbort.signal];
		if (abort)
			aborts.push(abort);
		const complextAbort = AbortSignal.any(aborts);

		const context: NavigateContext<this, TData> = {
			index: navIndex,
			id: Guid.createGuid(),
			source: isFirst ? "first" : "nav",
			app: this,
			abort: complextAbort,
			current: this.__lastNav?.context as NavigateContext<this, TData>,
			parent: parentNav?.context as NavigateContext<this, TData>,
			overided: false,
			action: action,
			data,
			url: navUrl.url,
			origin: navUrl.origin,
			pathAndQuery: navUrl.relative,
			basePath: navUrl.basePath,
			path: navUrl.path,
			query: navUrl.query,
			hash: navUrl.hash,
			external: navUrl.external,
			replace,
			scope,
			redirect: async (options?: NavigateOptions<TData> | string | null) => {
				complextAbort.throwIfAborted();
				const result = await this.nav<TData>(options);
				complextAbort.throwIfAborted();
				return result;
			}
		};

		const currentNav: ExecuteNav<this, TData> = { method: "navigate", context, abort: navAbort, status: "work" };
		return await this.__execNavigate(currentNav, parentNav) as NavigateContext<this, TData>;
	}

	/**
	 * Reload page with nav.
	 */
	reload() {
		this.__abort.signal.throwIfAborted();

		return this.nav({ replace: true });
	}

	/**
	 * Global reload page in browser.
	 */
	restart() {
		this.__abort.signal.throwIfAborted();

		window.location.reload();
	}

	async destroy<TData extends ContextData = ContextData>(contextData?: TData | null): Promise<StopContext<this, TData>> {
		if (this.__abort.signal.aborted)
			return Promise.reject('Application already destroyed.');
		this.__abort.abort();

		console.info("app destroy begin");

		if (this.__execNav)
			this.__execNav.abort.abort();
		if (this.__lastNav)
			this.__lastNav.abort.abort();

		if (this.__globalSubmit)
			this.element?.removeEventListener("submit", this.__globalSubmit);

		const destroyAbort = new AbortController();

		const context: StopContext<this, TData> = {
			abort: destroyAbort.signal,
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
		this.__abort.signal.throwIfAborted();

		return urlHelper.buildUrl(this.env.basePath, path, query, hash);
	}

	private async __onSubmit<TData extends ContextData>(options: SubmitOptions<TData> | HTMLFormElement) {
		const opt: SubmitOptions<TData> = options instanceof HTMLFormElement ? { form: <HTMLFormElement>options } : <SubmitOptions<TData>>options;
		const { form, button = null, query, data = <TData>{} } = opt;

		if ((!button || !button.formNoValidate) && !form.checkValidity())
			throw new Error('Form is invalid.');

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
			throw new Error('Form already submitting.');
		form.classList.add(CONSTANTS.LoadingElementClass);

		method = method.toUpperCase();

		try {

			if (method === "GET")
				await this.nav({ url, query: new FormData(form), data: data, replace, abort: opt.abort });
			else {
				const navUrl = urlHelper.parseUrl(this.env.basePath, url);
				if (query)
					urlHelper.extendQuery(navUrl, query);

				let parentNav: ExecuteNav<this, TData> | undefined;
				if (this.__execNav && this.__execNav.status === "work") {
					parentNav = this.__execNav as ExecuteNav<this, TData>;

					parentNav.abort.abort(NAV_OVERIDE_ERROR);
					(<any>parentNav.context).overided = true;
				}

				const navIndex = parentNav ? parentNav.context.index + 1 : 1;

				const submitAbort = new AbortController();
				const aborts: AbortSignal[] = [this.__abort.signal, submitAbort.signal];
				if (opt.abort)
					aborts.push(opt.abort);
				const complextAbort = AbortSignal.any(aborts);

				let context: SubmitContext<this, TData> = {
					index: navIndex,
					id: Guid.createGuid(),
					source: "submit",
					app: this,
					abort: complextAbort,
					current: this.__lastNav?.context as NavigateContext<this, TData>,
					parent: parentNav?.context as NavigateContext<this, TData>,
					overided: false,
					action: "submit",
					data,
					form,
					button,
					method,
					enctype,
					url: navUrl.url,
					origin: navUrl.origin,
					pathAndQuery: navUrl.relative,
					basePath: navUrl.basePath,
					path: navUrl.path,
					query: navUrl.query,
					hash: navUrl.hash,
					external: navUrl.external,
					replace,
					redirect: async (options?: NavigateOptions<TData> | string | null) => {
						complextAbort.throwIfAborted();
						const result = await this.nav<TData>(options);
						complextAbort.throwIfAborted();
						return result;
					}
				};

				const currentNav: ExecuteNav<this, TData> = { method: "submit", context, abort: submitAbort, status: "work" };
				await this.__execNavigate(currentNav);
			}
		}
		finally {
			form.classList.remove(CONSTANTS.LoadingElementClass);

			if (button)
				button.classList.remove(CONSTANTS.LoadingElementClass);
		}
	}

	private __onPopState(context: StartContext, event: PopStateEvent) {
		const popUrl = location.href;

		console.log(`popstate: ${popUrl}`, event.state);

		this.nav({ url: popUrl, data: { popstate: event.state } });
	}

	private async __execNavigate(nav: ExecuteNav<this>, parent?: ExecuteNav<this>) {
		if (parent)
			parent.overide = nav;

		try {
			console.info(`${nav.method} begin`, nav.context);

			nav.context.abort.throwIfAborted();
			this.__execNav = nav;

			await this.invoker.invoke(nav.method, nav.context);

			this.__lastNav = nav;

			nav.status = "success";
			console.info(`${nav.method} ${nav.status} ${nav.context.url}`);

			return nav.context;
		}
		catch (reason: any) {
			if (reason?.name === "AbortError") {
				nav.status = "cancelled";
				console.warn(`${nav.method} ${nav.status} ${nav.context.url}`);
			}
			else if (reason === NAV_OVERIDE_ERROR) {
				if (!nav.context.overided || !nav.overide)
					throw new Error("Nav is not overided.");

				nav.status = "overided";
				console.warn(`${nav.method} ${nav.status} ${nav.context.url}`);

				return nav.overide.context; // return redirected navigation
			}
			else {
				nav.status = "error";
				console.error(`${nav.method} ${nav.status} ${nav.context.url}: ${reason}`);
			}

			throw reason;
		}
	}
}

interface ExecuteNav<TApp extends Application = Application, TData extends ContextData = ContextData> {
	method: "navigate" | "submit";
	context: NavigateContext<TApp, TData>;
	abort: AbortController;
	status: ExecuteStatus;
	overide?: ExecuteNav<TApp, TData>;
}

type ExecuteStatus = "work" | "success" | "overided" | "cancelled" | "error";