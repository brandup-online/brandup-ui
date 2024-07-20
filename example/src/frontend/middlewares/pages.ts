import { Middleware, MiddlewareNext, NavigateContext, StartContext, StopContext, SubmitContext } from "brandup-ui-app";
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

	async start(_context: StartContext, next: MiddlewareNext) {
		window.addEventListener("popstate", (e: PopStateEvent) => {
			e.preventDefault();

			const url = location.href;

			console.log(`popstate: ${url}`);

			this.app.nav(url);
		});

		this.app.element?.insertAdjacentElement("beforeend", this._loaderElem = DOM.tag("div", "app-loader"));

		await next();
	}

	async navigate(context: NavigateContext<PageNavigationData>, next: MiddlewareNext) {
		if (context.external) {
			const linkElem = <HTMLLinkElement>DOM.tag("a", { href: context.url, target: "_blank" });
			linkElem.click();
			linkElem.remove();

			return false;
		}

		// resolve and load new page
		let pageDef = ROUTES[context.path.toLowerCase()] || ROUTE_NOTFOUND;
		const pageType = await pageDef.type();

		if (this._page) {
			// destroy prev page
			this._page.destroy();
			this._page = null;
		}

		// create and render new page
		const page: Page = new pageType.default(this.app, context);
		this._nav(context, page);
		await page.render(this._appContentElem);

		await next();
	}

	async submit(context: SubmitContext<PageSubmitData>, next: MiddlewareNext) {
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

		await next();
	}

	async stop(_context: StopContext, next: MiddlewareNext) {
		await next();

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