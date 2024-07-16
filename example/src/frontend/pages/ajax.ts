import { DOM } from "brandup-ui-dom";
import { Page } from "./base";

export default class AjaxPage extends Page {
	get typeName(): string { return "AjaxPage" }
	get header(): string { return "AJAX" }

	protected async onRenderContent(container: HTMLElement) {
		container.appendChild(DOM.tag("p", null, "Working application forms."));

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax1" }, "redirect")));
		this.registerCommand("ajax1", () => {
			this.ajax.push({
				url: "/redirect",
				disableCache: true,
				success: (response) => {
					alert(`${response.status}`);
				}
			});
		});
	}
}