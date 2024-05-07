import { LoadContext, Middleware, NavigateContext, StartContext, StopContext, SubmitContext } from "brandup-ui-app";
import { PageModel } from "../pages/base";
import { DOM } from "brandup-ui-dom";
import { AJAXMethod, AjaxResponse, ajaxRequest } from "brandup-ui-ajax";

export class PagesMiddleware extends Middleware {
    private _appContentElem: HTMLElement;
    private _pages: { [key: string]: PageDefinition };
    private _page: PageModel = null;

    start(context: StartContext, next: () => void, end: () => void) {
        this._appContentElem = document.getElementById("app-content");
        if (!this._appContentElem)
            throw new Error("Not found page content container.");

        this._pages = {
            '/': { type: () => import("../pages/index"), title: "Main page" },
            '/about': { type: () => import("../pages/about"), title: "About page" }
        };

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

        const pageDef = this._pages[context.path];
        if (!pageDef) {
            this._nav(context, "Page not found");

            DOM.empty(this._appContentElem);
            this._appContentElem.innerText = "Page not found";

            end();
            return;
        }

        this._nav(context, pageDef.title);

        pageDef.type()
            .then((t) => {
                DOM.empty(this._appContentElem);

                const content = document.createDocumentFragment();
                const contentElem = DOM.tag("div", "page");
                content.appendChild(contentElem);

                this._page = new t.default(this.app, contentElem);

                this._appContentElem.appendChild(content);

                super.navigate(context, next, end);
            })
            .catch((reason) => {
                console.error(reason);

                end();
            });
    }

    submit(context: SubmitContext, next: () => void, end: () => void) {
        const data = new FormData(context.form);
        const antyElem = <HTMLInputElement>document.getElementsByName("__RequestVerificationToken")[0];
        data.append(antyElem.name, antyElem.value);

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

    private _nav(context: NavigateContext, title: string) {
        if (context.replace)
            window.history.replaceState(window.history.state, title, context.url);
        else
            window.history.pushState(window.history.state, title, context.url);

        document.title = title;
    }
}

interface PageDefinition {
    title: string;
    type: () => Promise<any>;
}