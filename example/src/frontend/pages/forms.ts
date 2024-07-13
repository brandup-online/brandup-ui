import { DOM } from "brandup-ui-dom";
import { PageModel } from "./base";

export default class FormsPage extends PageModel {
	get typeName(): string { return "FormsPage" }
	get header(): string { return "Forms" }

	protected _onRenderElement(element: HTMLElement) {
		super._onRenderElement(element);

		element.appendChild(DOM.tag("p", null, "Working application forms."));

		element.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with post method"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.uri("/send") }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		element.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with get method"),
			DOM.tag("form", { class: "appform", method: "get" }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));
	}
}