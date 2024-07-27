import { DOM } from "@brandup/ui-dom";
import { AjaxQueue, } from "@brandup/ui-ajax";
import { Middleware, MiddlewareNext, NAV_OVERIDE_ERROR, NavigateContext, StartContext, StopContext, SubmitContext } from "@brandup/ui-app";
import { Page } from "../pages/base";
import { ExampleApplication } from "../app";
import { PageNavigationData, PageSubmitData } from "../typings/app";
import { FuncHelper } from "@brandup/ui-helpers";

class PagesMiddleware implements Middleware {
	readonly name: string = "pages";
	private _options: PagesOptions;
	private _appContentElem: HTMLElement;
	private _ajax: AjaxQueue;
	private _page: Page | null = null;
	private _loaderElem?: HTMLElement;

	constructor(options: PagesOptions) {
		this._options = options;

		const appContentElem = document.getElementById("app-content")
		if (!appContentElem)
			throw new Error("Not found page content container.");
		this._appContentElem = appContentElem;

		this._ajax = new AjaxQueue();
	}

	async start(context: StartContext, next: MiddlewareNext) {
		window.addEventListener("popstate", (e: PopStateEvent) => {
			e.preventDefault();

			console.log(`popstate`);

			context.app.nav();
		});

		context.app.element?.insertAdjacentElement("beforeend", this._loaderElem = DOM.tag("div", "app-loader"));

		for (var key in this._options.routes) {
			const route = this._options.routes[key];
			if (route.preload)
				await route.page();
		}

		if (this._options.notfound.preload)
			await this._options.notfound.page();

		await next();
	}

	async navigate(context: NavigateContext<ExampleApplication, PageNavigationData>, next: MiddlewareNext) {
		if (context.external) {
			const linkElem = DOM.tag("a", { href: context.url, target: "_blank" });
			linkElem.click();
			linkElem.remove();
			return;
		}

		const result = await FuncHelper.minWaitAsync<{ page: Page, content: DocumentFragment }>(async () => {
			// resolve and load new page
			let pageDef = this._options.routes[context.path.toLowerCase()];
			if (!pageDef) {
				console.warn(`page notfound`, context.path);
				pageDef = this._options.notfound;
			}

			let pageType = await pageDef.page();

			let page: Page | undefined;
			let content: DocumentFragment;
			try {
				// create and render new page

				if (!pageType.default)
					throw new Error("Page type is not default.");

				page = new pageType.default(context) as Page;
				content = await page.render();
			}
			catch (reason) {
				page?.destroy();

				if (reason != NAV_OVERIDE_ERROR) {
					console.error(`page error`, reason);

					pageDef = this._options.error;
					pageType = await pageDef.page();
					page = new pageType.default(context) as Page;
					content = await page.render();
				}
				else
					throw reason;
			}

			return { page, content };
		}); // 300

		try {
			context.abort.throwIfAborted();
		}
		catch (reason) {
			result.page?.destroy();
			throw reason;
		}

		const prevPage = this._page;

		this._nav(context, result.page);

		// destroy current page
		prevPage?.destroy();
		this._appContentElem.appendChild(result.content);

		await next();
	}

	async submit(context: SubmitContext<ExampleApplication, PageSubmitData>, next: MiddlewareNext) {
		if (!this._page)
			throw new Error();

		const page = context.data.page = this._page;

		const response = context.data.response = await this._ajax.enque({
			url: context.url,
			method: context.method,
			data: new FormData(context.form)
		});

		if (response.redirected) {
			await context.app.nav({ url: response.url, data: context.data });
		}
		else
			await page.formSubmitted(response, context);

		await next();
	}

	async stop(_context: StopContext, next: MiddlewareNext) {
		await next();

		this._ajax.destroy();
	}

	private _nav(context: NavigateContext, page: Page) {
		this._page = page;

		const title = page.header;

		if (context.source != "first") {
			let url = context.url;
			if (context.hash)
				url += "#" + context.hash;

			if (context.replace)
				window.history.replaceState(window.history.state, title, url);
			else
				window.history.pushState(window.history.state, title, url);
		}

		document.title = title;
	}
}

export interface PagesOptions {
	routes: Routes;
	notfound: Route;
	error: Route;
}

export interface Routes {
	[url: string]: Route;
}

export interface Route {
	page: () => Promise<{ default: typeof Page | any }>;
	preload?: boolean;
}

export default (options: PagesOptions) => new PagesMiddleware(options);