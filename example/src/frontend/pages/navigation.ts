import { DOM } from "@brandup/ui-dom";
import { Page } from "./base";
import { PageNavigationData } from "frontend/typings/app";

export default class NavigationPage extends Page {
	get typeName(): string { return "AboutModel" }
	get header(): string { return "Navigation" }

	protected async onRenderContent(container: HTMLElement) {
		container.appendChild(DOM.tag("p", null, "Working page navigation."));

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
			this.app.nav({ url: "?test=test", query: { test: ["test1", "test2"] } });
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav2" }, "nav: empty")));
		this.registerCommand("nav2", () => {
			this.app.nav({});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav3" }, "nav: callback")));
		this.registerCommand("nav3", () => {
			this.app.nav({ url: "/forms", callback: (result) => { alert(result.status); } });
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav4" }, "nav: with replace")));
		this.registerCommand("nav4", () => {
			this.app.nav({ query: { test: "test" }, replace: true });
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav5" }, "nav: error")));
		this.registerCommand("nav5", () => {
			this.app.nav<PageNavigationData>({ data: { error: true } });
		});
	}
}