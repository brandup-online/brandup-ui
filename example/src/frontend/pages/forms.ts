import { DOM } from "brandup-ui-dom";
import { Page } from "./base";

export default class FormsPage extends Page {
	get typeName(): string { return "FormsPage" }
	get header(): string { return "Forms" }

	protected async onRenderContent(container: HTMLElement) {
		container.appendChild(DOM.tag("p", null, "Working application forms."));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with post method"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.uri("/send") }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit post with empty action"),
			DOM.tag("form", { class: "appform", method: "post" }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit post with button formaction"),
			DOM.tag("form", { class: "appform", method: "post", action: "/forms" }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit", formaction: this.app.uri("/send") }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with get method"),
			DOM.tag("form", { class: "appform", method: "get" }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));
	}
}