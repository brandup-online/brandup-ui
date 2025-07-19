import { DOM } from "@brandup/ui-dom";
import { Page } from "../../page";

export default class IndexModel extends Page {
	get typeName(): string { return "IndexModel" }
	get header(): string { return "My account" }

	protected async onRenderContent(container: HTMLElement) {
		container.insertAdjacentElement("beforeend", DOM.tag("p", null, "Area page"))
	}
}