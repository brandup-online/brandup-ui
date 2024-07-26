import { DOM } from "@brandup/ui-dom";
import { Page } from "./base";
import { PageNavigationData } from "frontend/typings/app";
import { FuncHelper } from "@brandup/ui-helpers";

export default class NavigationPage extends Page {
	get typeName(): string { return "AboutModel" }
	get header(): string { return "Navigation" }

	protected async onRenderContent(container: HTMLElement) {
		if (this.context.query.has("error"))
			throw new Error("Error is page render.");
		if (this.context.query.has("redirect"))
			await this.context.redirect("/forms");
		if (this.context.query.has("long"))
			await FuncHelper.delay(5000, this.context.abort);

		container.appendChild(DOM.tag("p", null, "Working page navigation."));

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "?error=true", class: "applink" }, "nav to error in page")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "?redirect=true", class: "applink" }, "nav to redirect in page")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "?long=true", class: "applink" }, "nav to long render")));

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "#test1" }, "hash1")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "#test2" }, "hash2")));

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms" }, "link: direct navigate")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms", class: "applink" }, "link: navigate to /forms")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms/", class: "applink" }, "link: navigate to /forms/")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "forms", class: "applink" }, "link: navigate to forms")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/test", class: "applink" }, "link: notfound")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "https://ya.ru", class: "applink" }, "link: external")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms", class: "applink", dataset: { navReplace: "true" } }, "link: navigate with replace")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms#test", class: "applink" }, "link: navigate to page with hash")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "#test", class: "applink" }, "link: navigate only hash")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "?test=test", class: "applink" }, "link: navigate only params")));
		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "?test=test#test", class: "applink" }, "link: navigate with params and hash")));

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav1" }, "nav: with add query param")));
		this.registerCommand("nav1", () => {
			return this.app.nav({ url: "?test=test", query: { test: ["test1", "test2"] } });
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav2" }, "nav: empty")));
		this.registerCommand("nav2", () => {
			return this.app.nav({});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav4" }, "nav: with replace")));
		this.registerCommand("nav4", () => {
			return this.app.nav({ query: { test: "test" }, replace: true });
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav5" }, "nav: error")));
		this.registerCommand("nav5", () => {
			return this.app.nav<PageNavigationData>({ data: { error: true } });
		});
	}
}