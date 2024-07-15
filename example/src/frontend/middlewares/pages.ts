import { LoadContext, Middleware, NavigateContext, StartContext, StopContext, SubmitContext } from "brandup-ui-app";
import { Page } from "../pages/base";
import { DOM } from "brandup-ui-dom";
import { AJAXMethod, AjaxResponse, ajaxRequest } from "brandup-ui-ajax";
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
	private _page: Page | null = null;

	constructor() {
		super();

		const appContentElem = document.getElementById("app-content")
		if (!appContentElem)
			throw new Error("Not found page content container.");
		this._appContentElem = appContentElem;
	}

	start(context: StartContext, next: () => void, end: () => void) {
		window.addEventListener("popstate", (e: PopStateEvent) => {
			e.preventDefault();

			this.app.nav({ url: location.href, replace: true });
		});

		super.start(context, next, end);
	}

	loaded(context: LoadContext, next: () => void, end: () => void) {
		super.loaded(context, next, end);
	}

	navigate(context: NavigateContext, next: () => void, end: () => void) {
		if (this._page) {
			this._page.destroy();
			this._page = null;
		}

		let pageDef = ROUTES[context.path.toLowerCase()] || ROUTE_NOTFOUND;

		pageDef.type()
			.then((t) => {
				DOM.empty(this._appContentElem);

				const page = new t.default(this.app);
				this._nav(context, page);

				return page?.render(this._appContentElem);
			})
			.then(() => {
				context.items["page"] = this._page;

				super.navigate(context, next, end);
			})
			.catch((reason) => {
				console.error(reason);

				end();
			});
	}

	submit(context: SubmitContext, next: () => void, end: () => void) {
		const data = new FormData(context.form);

		ajaxRequest({
			url: context.url,
			method: <AJAXMethod>context.method.toUpperCase(),
			data: data,
			success: (response: AjaxResponse) => {
				alert(response.data);

				super.submit(context, next, end);
			}
		});
	}

	stop(context: StopContext, next: () => void, end: () => void) {
		super.stop(context, next, end);
	}

	private _nav(context: NavigateContext, page: Page) {
		this._page = page;

		const title = page.header;

		if (context.replace)
			window.history.replaceState(window.history.state, title, context.url);
		else
			window.history.pushState(window.history.state, title, context.url);

		document.title = title;
	}
}

interface PageDefinition {
	type: () => Promise<{ default: typeof Page | any }>;
}