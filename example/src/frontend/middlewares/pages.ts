﻿import { DOM } from "brandup-ui-dom";
import { AjaxQueue, } from "brandup-ui-ajax";
import { Middleware, MiddlewareNext, NavigateContext, StartContext, StopContext, SubmitContext } from "brandup-ui-app";
import { Page } from "../pages/base";
import { ExampleApplication } from "../app";
import { PageNavigationData, PageSubmitData } from "../typings/app";

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

			const url = location.href;

			console.log(`popstate: ${url}`);

			context.app.nav(url);
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
			const linkElem = <HTMLLinkElement>DOM.tag("a", { href: context.url, target: "_blank" });
			linkElem.click();
			linkElem.remove();

			return;
		}

		// resolve and load new page
		let pageDef = this._options.routes[context.path.toLowerCase()] || this._options.notfound;
		const pageType = await pageDef.page();

		if (this._page) {
			// destroy prev page
			this._page.destroy();
			this._page = null;
		}

		// create and render new page
		const page: Page = new pageType.default(context);
		this._nav(context, page);
		await page.render(this._appContentElem);

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
			if (context.replace)
				window.history.replaceState(window.history.state, title, context.url);
			else
				window.history.pushState(window.history.state, title, context.url);
		}

		document.title = title;
	}
}

export interface PagesOptions {
	routes: Routes;
	notfound: Route;
}

export interface Routes {
	[url: string]: Route;
}

export interface Route {
	page: () => Promise<{ default: typeof Page | any }>;
	preload?: boolean;
}

export default (options: PagesOptions) => new PagesMiddleware(options);