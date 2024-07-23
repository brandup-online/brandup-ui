import { UIElement } from "@brandup/ui";
import { EnvironmentModel, ApplicationModel, QueryParams } from "./typings/app";
import { Middleware, StartContext, StopContext, NavigateContext, SubmitContext, InvokeContext, ContextData } from "./middlewares/base";
import { MiddlewareInvoker } from "./middlewares/invoker";
import StateMiddleware from "./middlewares/state";
import HyperLinkMiddleware from "./middlewares/hyperlink";
import FormMiddleware from "./middlewares/form";
import urlHelper from "./helpers/url";
import BROWSER from "./browser";

/**
 * Base application class.
 */
export class Application<TModel extends ApplicationModel = ApplicationModel> extends UIElement {
	readonly env: EnvironmentModel;
	readonly model: TModel;
	private readonly __invoker: MiddlewareInvoker;
	private __isInitialized = false;
	private __isDestroy = false;
	private __middlewares: { [key: string]: Middleware } = {};
	private __lastNav: NavigateContext | null = null;

	constructor(env: EnvironmentModel, model: TModel, ...args: any[]) {
		super();

		this.env = env;
		this.model = model;

		const core: Middleware = { name: "app-root" };
		this.__invoker = new MiddlewareInvoker(core);
	}

	get typeName(): string { return "Application" }

	/** Middleware methods invoker. */
	get invoker(): MiddlewareInvoker { return this.__invoker; }

	/**
	 * @param middlewares Initialize application with middlewares. Using in ApplicationBuilder.
	 */
	initialize(middlewares: Array<Middleware>) {
		if (this.__isInitialized)
			throw 'Application already initialized.';
		this.__isInitialized = true;

		this.onInitialize();

		middlewares.forEach(middleware => {
			var name = middleware.name;

			if (this.__middlewares.hasOwnProperty(name))
				throw `Middleware "${name}" already registered.`;

			this.__middlewares[name] = middleware;

			this.__invoker.next(middleware);
		});
	}

	protected onInitialize() {
		this.__invoker.next(StateMiddleware());
		this.__invoker.next(HyperLinkMiddleware());
		this.__invoker.next(FormMiddleware());
	}

	/**
	 * Get middleware by type.
	 * @param type Type of middleware.
	 * @returns Middleware instance.
	 */
	middleware<T extends Middleware>(name: string): T {
		const middleware: any = this.__middlewares[name];
		if (!middleware)
			throw `Middleware ${name} is not registered.`;

		return <T>middleware;
	}

	/**
	 * Run application.
	 * @param contextData Run context data.
	 * @param element HTMLElement of application. Default is document.body.
	 * @returns Promise of runned result.
	 */
	async run<TData extends ContextData>(contextData?: TData | null, element?: HTMLElement): Promise<NavigateContext<this, TData>> {
		if (!contextData)
			contextData = <TData>{};

		this.setElement(element || BROWSER.body);

		try {
			const context: StartContext<this, TData> = {
				app: this,
				data: contextData
			};
			await this.__invoker.invoke("start", context);
			console.info("app start success");

			await this.__invoker.invoke("loaded", context);
			console.info("app load success");

			return await this.nav({ data: context.data });
		}
		catch (reason) {
			console.error(`Unable to run application with reason: ${reason}`);

			throw reason;
		}
		finally {
			console.info("app runned");
		}
	}

	/**
	 * Navigate application to url.
	 * @param options Navigate options.
	 * @returns Promise of navigated result.
	 */
	async nav<TData extends ContextData>(options?: NavigationOptions<TData> | string | null): Promise<NavigateContext<this, TData>> {
		const opt: NavigationOptions<TData> = (!options || options instanceof String) ? { url: <string>options } : <NavigationOptions<TData>>options;
		let { url = null, replace = false, data = <TData>{}, callback } = opt;

		const navUrl = urlHelper.parseUrl(url);
		if (opt.query)
			urlHelper.extendQuery(navUrl, opt.query);

		const isFirst = !this.__lastNav;

		const context: NavigateContext<this, TData> = this.__lastNav = {
			app: this,
			source: isFirst ? "first" : "nav",
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

		console.info(context);

		try {
			console.info(`app nav begin ${navUrl.full}`);

			await this.__invoker.invoke("navigate", context);

			if (callback)
				callback({ status: "success", context: context });

			console.info(`app nav success ${navUrl.full}`);

			return context;
		}
		catch (reason) {
			if (callback)
				callback({ status: "error", context: context });

			console.error(`app nav error ${navUrl.full}: ${reason}`);

			throw reason;
		}
	}

	/**
	 * Submit application form.
	 * @param options Submit options.
	 * @returns Promise of submitted result.
	 */
	async submit<TData extends ContextData>(options: SubmitOptions<TData> | HTMLFormElement): Promise<SubmitContext<this, TData>> {
		const opt: SubmitOptions<TData> = options instanceof HTMLFormElement ? { form: <HTMLFormElement>options } : <SubmitOptions<TData>>options;
		const { form, button = null, query, data = <TData>{}, callback = null } = opt;

		let method = form.method;
		let enctype = form.enctype;
		let url = form.action;

		if (button) {
			// Get button patameters for request
			if (button.hasAttribute("formmethod"))
				method = button.formMethod;
			if (button.hasAttribute("formenctype"))
				enctype = button.formEnctype;
			if (button.hasAttribute("formaction"))
				url = button.formAction;
		}

		method = method.toUpperCase();

		const navUrl = urlHelper.parseUrl(url);

		if (query)
			urlHelper.extendQuery(navUrl, query);

		let submitContext: SubmitContext<this, TData> = {
			app: this,
			source: "submit",
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
			replace: false
		};

		try {
			console.info(`submit ${method} begin ${navUrl.full}`);

			await this.__invoker.invoke("submit", submitContext);

			console.info(`submit ${method} success ${navUrl.full}`);

			if (callback)
				callback({ status: "success", context: submitContext });
		}
		catch (reason) {
			console.error(`submit ${method} error ${navUrl.full} reason: ${reason}`)

			if (callback)
				callback({ status: "error", context: submitContext });

			throw reason;
		}

		return submitContext;
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

		const context: StopContext<Application, TData> = {
			app: this,
			data: contextData || <TData>{}
		};

		try {
			await this.__invoker.invoke("stop", context);

			console.info("app destroy success");

			return context;
		}
		catch (reason) {
			console.error(`app destroy error: ${reason}`);
			throw reason;
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
}

export interface NavigationOptions<TData extends ContextData = ContextData> {
	url?: string | null;
	query?: QueryParams | URLSearchParams | FormData;
	replace?: boolean;
	data?: TData;
	callback?: (result: CallbackResult<NavigateContext<Application, TData>>) => void | null;
}

export interface SubmitOptions<TData extends ContextData = ContextData> {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	query?: QueryParams | URLSearchParams;
	data?: TData;
	callback?: (result: CallbackResult<SubmitContext<Application, TData>>) => void;
}

export interface CallbackResult<TContext extends InvokeContext> {
	status: CallbackStatus;
	context: TContext;
}

export type CallbackStatus = "success" | "error";