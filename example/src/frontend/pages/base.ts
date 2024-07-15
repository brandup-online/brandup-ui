import { UIElement } from "brandup-ui";
import { AjaxQueue } from "brandup-ui-ajax";
import { DOM } from "brandup-ui-dom";
import { ExampleApplication } from "../app";

export abstract class Page extends UIElement {
	readonly app: ExampleApplication;
	readonly ajax: AjaxQueue;

	constructor(app: ExampleApplication) {
		super();

		this.app = app;
		this.ajax = new AjaxQueue();
	}

	async render(container: HTMLElement) {
		const content = document.createDocumentFragment();
		const pageElem = DOM.tag("div", "page");
		content.appendChild(pageElem);

		this.setElement(pageElem);

		await this.onRenderContent(pageElem);

		container.appendChild(content);
	}

	protected _onRenderElement(element: HTMLElement) {
		element.appendChild(DOM.tag("header", "page-header", [
			DOM.tag("h1", null, this.header)
		]));
	}

	abstract get header(): string;
	protected abstract onRenderContent(container: HTMLElement): Promise<void>;

	destroy() {
		if (this.element)
			DOM.empty(this.element);

		this.ajax.destroy();

		super.destroy();
	}
}