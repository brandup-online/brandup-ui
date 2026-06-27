import { AjaxQueue, AjaxResponse } from "@brandup/ui-ajax";
import { DOM } from "@brandup/ui-dom";
import { ExampleApplication } from "../app";
import { PageNavigationData, PageSubmitData } from "../typings/app";
import { Page as AppPage, NavigateContext, SubmitContext } from "@brandup/ui-app";

export abstract class Page extends AppPage<ExampleApplication, PageNavigationData> {
	readonly app: ExampleApplication;
	readonly ajax: AjaxQueue;

	constructor(context: NavigateContext<ExampleApplication, PageNavigationData>) {
		super(context);

		this.app = context.app;
		this.ajax = new AjaxQueue();

		context.data.page = this;
	}

	async render(): Promise<DocumentFragment> {
		const content = document.createDocumentFragment();
		const pageElem = DOM.tag("div", { class: "page" });
		content.appendChild(pageElem);

		this.setElement(pageElem);

		await this.onRenderContent(pageElem);

		// Notify the page of an opening hash, like a hash navigation does.
		await this.triggerChangeHash();

		return content;
	}

	protected override _onRenderElement(element: HTMLElement) {
		element.appendChild(DOM.tag("header", { class: "page-header" }, [
			DOM.tag("h1", null, this.header)
		]));
	}

	formSubmitted(response: AjaxResponse, context: SubmitContext<ExampleApplication, PageSubmitData>) {
		console.log(response);

		return this.onFormSubmitted(response, context);
	}

	abstract get header(): string;
	protected abstract onRenderContent(container: HTMLElement): Promise<void>;
	protected async onFormSubmitted(_response: AjaxResponse, _context: SubmitContext<ExampleApplication, PageSubmitData>) { }

	override destroy() {
		this.ajax.destroy();
		this.element?.remove();

		super.destroy();
	}
}
