import { DOM } from "@brandup/ui-dom";
import { AjaxQueue, } from "@brandup/ui-ajax";
import { Middleware, MiddlewareNext, NAV_OVERIDE_ERROR, NavigateContext, StartContext, StopContext, SubmitContext } from "@brandup/ui-app";
import { Page } from "../areas/page";
import { ExampleApplication } from "../app";
import type { PageNavigationData, PageSubmitData } from "../typings/app";
import { FuncHelper } from "@brandup/ui-helpers";
import AREAS from "../areas";

class PagesMiddlewareImpl implements Middleware, PagesMiddleware {
	readonly name: string = "pages";
	private _options: PagesOptions;
	private _ajax: AjaxQueue;

	constructor(options: PagesOptions) {
		this._options = options;

		this._ajax = new AjaxQueue();
	}

	async start(context: StartContext, next: MiddlewareNext) {
		context.app.element?.insertAdjacentElement("beforeend", DOM.tag("div", { class: "app-loader" }));

		const bodyElem = document.body;

		bodyElem.addEventListener("invalid", (event: Event) => {
			event.preventDefault();

			const elem = event.target as HTMLElement;
			elem.classList.add("invalid");

			if (elem.hasAttribute("required"))
				elem.classList.add("invalid-required");
		}, true);

		bodyElem.addEventListener("change", (event: Event) => {
			const elem = event.target as HTMLElement;
			elem.classList.remove("invalid");
			elem.classList.remove("invalid-required");
		});

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

		if (context.basePath != context.app.env.basePath) {
			// If the base path changed, reload the page
			console.log(`Change base path from "${context.app.env.basePath}" to "${context.basePath}"`);
			location.href = context.url;
			return;
		}
		else if (!context.basePath) {
			var area = AREAS.findArea(context.path);
			if (area && area.basePath) {
				console.log(`Change base path from "${context.app.env.basePath}" to "${area.basePath}"`);
				location.href = context.url;
				return;
			}
		}

		switch (context.action) {
			case "hash": {
				const page = context.app.page;
				if (page) {
					this._setPage(context.app, page);
					await page.__changedHash(context);

					await next();
					return;
				}
			}
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

		const prevPage = context.app.page;

		this._setPage(context.app, result.page);

		// destroy current page
		prevPage?.destroy();
		context.app.contentElem.appendChild(result.content);

		await next();
	}

	async submit(context: SubmitContext<ExampleApplication, PageSubmitData>, next: MiddlewareNext) {
		const page = context.app.page;
		if (!page)
			throw new Error();

		context.data.page = page;

		const response = context.data.response = await this._ajax.enqueue({
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

	private _setPage(app: ExampleApplication, page: Page) {
		// The current page now lives on the application (app.page); the address bar is handled
		// by the built-in HistoryMiddleware. The document title stays a page concern.
		app.setPage(page);
		document.title = page.header;
	}
}

export interface PagesMiddleware {
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

export default (options: PagesOptions) => new PagesMiddlewareImpl(options);