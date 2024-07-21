import { UIElement } from "@brandup/ui";
import { AjaxQueue, AjaxResponse } from "@brandup/ui-ajax";
import { DOM } from "@brandup/ui-dom";
import { ExampleApplication } from "../app";
import { PageNavigationData, PageSubmitData } from "frontend/typings/app";
import { NavigateContext, SubmitContext } from "@brandup/ui-app";

export abstract class Page extends UIElement {
	readonly app: ExampleApplication;
	readonly context: NavigateContext<ExampleApplication, PageNavigationData>;
	readonly ajax: AjaxQueue;

	constructor(context: NavigateContext<ExampleApplication, PageNavigationData>) {
		super();

		this.app = context.app;
		this.context = context;
		this.ajax = new AjaxQueue();

		this.context.data.page = this;
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

	formSubmitted(response: AjaxResponse, context: SubmitContext<ExampleApplication, PageSubmitData>) {
		console.log(response);

		return this.onFormSubmitted(response, context);
	}

	abstract get header(): string;
	protected abstract onRenderContent(container: HTMLElement): Promise<void>;
	protected async onFormSubmitted(response: AjaxResponse, context: SubmitContext<ExampleApplication, PageSubmitData>) { }

	destroy() {
		if (this.element)
			DOM.empty(this.element);

		this.ajax.destroy();

		super.destroy();
	}
}