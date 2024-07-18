import { Middleware, NavigateContext, StartContext, StopContext, SubmitContext } from "brandup-ui-app";
import { Page } from "../pages/base";
import { DOM } from "brandup-ui-dom";
import { AjaxQueue, AjaxResponse } from "brandup-ui-ajax";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel } from "../typings/app";

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

	async navigate(context: NavigateContext) {
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

		const page: Page = new pageType.default(this.app);

		this._nav(context, page);

		page.render(this._appContentElem);
		context.data["page"] = page;
	}

	submit(context: SubmitContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		const data = new FormData(context.form);

		this._ajax.push({
			url: context.url,
			method: context.method,
			data: data,
			success: (response: AjaxResponse) => {
				if (response.redirected) {
					this.app.nav({
						url: response.url, callback: () => end()
					});
				}
				else if (response.status === 200) {
					alert(response.data);
					next();
				}
				else {
					alert(`error submit ${response.status}`);
					error(`Submit response status: ${response.status}`);
				}
			},
			error: () => {
				error("Submit request aborted.");
			}
		});
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