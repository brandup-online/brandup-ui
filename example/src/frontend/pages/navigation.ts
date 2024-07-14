import { DOM } from "brandup-ui-dom";
import { PageModel } from "./base";

export default class NavigationPage extends PageModel {
	get typeName(): string { return "AboutModel" }
	get header(): string { return "Navigation" }

	protected _onRenderElement(element: HTMLElement) {
		super._onRenderElement(element);

		element.appendChild(DOM.tag("p", null, "Working page navigation."));

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms", class: "applink" }, "link: navigate to page")));
		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms", class: "applink", dataset: { navReplace: "true" } }, "link: navigate with replace")));
		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms#test", class: "applink" }, "link: navigate to page with hash")));
		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "#test", class: "applink" }, "link: navigate only hash")));
		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "?test=test", class: "applink" }, "link: navigate only params")));

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav1" }, "nav: with add query param")));
		this.registerCommand("nav1", () => {
			this.app.nav({ url: "?test=test", query: { test: ["test1", "test2"] } });
		});

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav2" }, "nav: empty")));
		this.registerCommand("nav2", () => {
			this.app.nav({});
		});

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav3" }, "nav: callback")));
		this.registerCommand("nav3", () => {
			this.app.nav({ url: "/forms", callback: (result) => { alert(result.status); } });
		});

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav4" }, "nav: with replace")));
		this.registerCommand("nav4", () => {
			this.app.nav({ query: { test: "test" }, replace: true });
		});
	}
}