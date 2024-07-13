import { DOM } from "brandup-ui-dom";
import { PageModel } from "./base";

export default class NavigationPage extends PageModel {
	get typeName(): string { return "AboutModel" }
	get header(): string { return "Navigation" }

	protected _onRenderElement(element: HTMLElement) {
		super._onRenderElement(element);

		element.appendChild(DOM.tag("p", null, "Working page navigation."));

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms", class: "applink" }, "navigate to page")));
		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "/forms#test", class: "applink" }, "navigate to page with hash")));

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "#test", class: "applink" }, "navigate only hash")));

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "?test=test", class: "applink" }, "navigate only params")));

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav1" }, "navigate with add query param")));
		this.registerCommand("nav1", () => {
			this.app.nav({ url: "?test=test", query: { test: ["test1", "test2"] } });
		});

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav2" }, "navigate empty")));
		this.registerCommand("nav2", () => {
			this.app.nav({});
		});

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav3" }, "navigate callback")));
		this.registerCommand("nav3", () => {
			this.app.nav({ url: "/about", callback: (result) => { alert(result.status); } });
		});

		element.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "nav4" }, "navigate with replace")));
		this.registerCommand("nav4", () => {
			this.app.nav({ url: null, query: { test: "test" }, replace: true });
		});
	}
}