import { DOM } from "@brandup/ui-dom";
import { Page } from "./base";

export default class FormsPage extends Page {
	get typeName(): string { return "FormsPage" }
	get header(): string { return "Forms" }

	protected async onRenderContent(container: HTMLElement) {
		container.appendChild(DOM.tag("p", null, "Working application forms."));

		let form: HTMLFormElement;
		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit by page method"),
			form = DOM.tag("form", { class: "appform", method: "post", enctype: "multipart/form-data", action: this.app.buildUrl("/_form/send") }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "button", command: "submit" }, "Send")
			])
		]));

		this.registerCommand("submit", () => {
			form.dispatchEvent(new SubmitEvent("submit", { submitter: form, bubbles: true }));
		});

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form as multipart/form-data"),
			DOM.tag("form", { class: "appform", method: "post", enctype: "multipart/form-data", action: this.app.buildUrl("/_form/send") }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with post method"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.buildUrl("/_form/send") }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit button with validate"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.buildUrl("/_form/send") }, [
				DOM.tag("input", { type: "text", name: "value", required: "" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit button with formnovalidate"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.buildUrl("/_form/send") }, [
				DOM.tag("input", { type: "text", name: "value", required: "" }),
				DOM.tag("button", { type: "submit", formnovalidate: "" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with formnovalidate (not working)"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.buildUrl("/_form/send"), formnovalidate: "" }, [
				DOM.tag("input", { type: "text", name: "value", required: "" }),
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
				DOM.tag("button", { type: "submit", formaction: this.app.buildUrl("/_form/send") }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form and redirect"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.buildUrl("/_form/redirect") }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form and external redirect"),
			DOM.tag("form", { class: "appform", method: "post", action: this.app.buildUrl("/_form/redirect-external") }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with get method"),
			DOM.tag("form", { class: "appform", method: "get" }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));

		container.appendChild(DOM.tag("div", null, [
			DOM.tag("p", null, "Submit form with get to other page"),
			DOM.tag("form", { class: "appform", method: "get", action: "/" }, [
				DOM.tag("input", { type: "text", name: "value" }),
				DOM.tag("button", { type: "submit" }, "Send")
			])
		]));
	}
}