﻿import { Middleware, NavigateContext, StartContext, StopContext, SubmitContext } from "brandup-ui-app";
import { Page } from "../pages/base";
import { DOM } from "brandup-ui-dom";
import { AjaxQueue, } from "brandup-ui-ajax";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel, PageNavigationData, PageSubmitData } from "../typings/app";

const ROUTES: { [key: string]: PageDefinition } = {
	'/': { type: () => import("../pages/index") },
	'/navigation': { type: () => import("../pages/navigation") },
	'/forms': { type: () => import("../pages/forms") },
	'/ajax': { type: () => import("../pages/ajax") }
};

const ROUTE_NOTFOUND: PageDefinition = { type: () => import("../pages/notfound") };

export class PagesMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {
	private _appContentElem: HTMLElement;
	private readonly _ajax: AjaxQueue;
	private _page: Page | null = null;
	private _loaderElem?: HTMLElement;

	constructor() {
		super();

		const appContentElem = document.getElementById("app-content")
		if (!appContentElem)
			throw new Error("Not found page content container.");
		this._appContentElem = appContentElem;

		this._ajax = new AjaxQueue();
	}

	async start(_context: StartContext) {
		window.addEventListener("popstate", (e: PopStateEvent) => {
			e.preventDefault();

			console.log("popstate");

			this.app.nav({ url: null, replace: true });
		});

		this.app.element?.insertAdjacentElement("beforeend", this._loaderElem = DOM.tag("div", "app-loader"));
	}

	async navigate(context: NavigateContext<PageNavigationData>) {
		if (context.external) {
			const linkElem = <HTMLLinkElement>DOM.tag("a", { href: context.url, target: "_blank" });
			linkElem.click();
			linkElem.remove();

			return false;
		}

		if (this._page) {
			this._page.destroy();
			this._page = null;
		}

		let pageDef = ROUTES[context.path.toLowerCase()] || ROUTE_NOTFOUND;

		const pageType = await pageDef.type();

		const page: Page = new pageType.default(this.app, context);

		this._nav(context, page);

		page.render(this._appContentElem);
	}

	async submit(context: SubmitContext<PageSubmitData>) {
		if (!this._page)
			throw new Error();

		const page = context.data.page = this._page;

		const response = context.data.response = await this._ajax.enque({
			url: context.url,
			method: context.method,
			data: new FormData(context.form)
		});

		if (response.redirected) {
			return this.app.nav({ url: response.url, data: context.data });
		}
		else
			await page.formSubmitted(response, context);
	}

	stop(_context: StopContext, next: VoidFunction) {
		next();

		this._ajax.destroy();
	}

	private _nav(context: NavigateContext, page: Page) {
		this._page = page;

		const title = page.header;

		if (context.replace || context.source === "first")
			window.history.replaceState(window.history.state, title, context.url);
		else
			window.history.pushState(window.history.state, title, context.url);

		document.title = title;
	}
}

interface PageDefinition {
	type: () => Promise<{ default: typeof Page | any }>;
}