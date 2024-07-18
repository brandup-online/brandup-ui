import { DOM } from "brandup-ui-dom";
import { Page } from "./base";
import { AjaxQueue } from "brandup-ui-ajax";
import { ExampleApplication } from "frontend/app";

export default class AjaxPage extends Page {
	get typeName(): string { return "AjaxPage" }
	get header(): string { return "AJAX" }

	readonly queue: AjaxQueue;

	constructor(app: ExampleApplication) {
		super(app);

		this.queue = new AjaxQueue({
			canRequest: (request) => {
				console.log("begin request");
				console.log(request);

				if (request.url?.includes("can-request")) {
					console.log("can not request");
					return false;
				}

				return true;
			},
			successRequest: (request, response) => {
				console.log(response);
				console.log("success request");
				alert(`${response.status} ${response.redirected ? "redirect" : ":"} ${response.url} ${response.type} ${response.contentType} ${response.data}`);
			},
			errorRequest: (request, reason) => {
				console.warn(`error request: ${reason}`);
				console.log("error request");
			}
		});
	}

	protected async onRenderContent(container: HTMLElement) {
		container.appendChild(DOM.tag("p", null, "Working application forms."));

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "empty-url" }, "empty url")));
		this.registerCommand("empty-url", () => {
			this.queue.push({
				success: (response) => console.log("success empty-url")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "can-request" }, "can request")));
		this.registerCommand("can-request", () => {
			this.queue.push({
				url: "?can-request",
				success: (response) => console.log("success can-request")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "send-json" }, "send json")));
		this.registerCommand("send-json", () => {
			this.queue.push({
				method: "POST",
				url: "/_ajax/send-json",
				data: { test: "test" },
				disableCache: true,
				success: (response) => console.log("success send-json")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "redirect-internal" }, "redirect")));
		this.registerCommand("redirect-internal", () => {
			this.queue.push({
				url: "/_ajax/redirect",
				disableCache: true,
				success: (response) => console.log("success redirect-internal")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "redirect-external" }, "redirect external")));
		this.registerCommand("redirect-external", () => {
			this.queue.push({
				url: "https://wsender.ru",
				disableCache: true,
				success: (response) => console.log("success redirect-external")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-json" }, "response json")));
		this.registerCommand("ajax-json", () => {
			this.queue.push({
				url: "/_ajax/json",
				disableCache: true,
				success: (response) => console.log("success ajax-json")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-html" }, "response html")));
		this.registerCommand("ajax-html", () => {
			this.queue.push({
				url: "/_ajax/html",
				disableCache: true,
				success: (response) => console.log("success ajax-html")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-text" }, "response text")));
		this.registerCommand("ajax-text", () => {
			this.queue.push({
				url: "/_ajax/text",
				disableCache: true,
				success: (response) => console.log("success ajax-text")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-image" }, "response image")));
		this.registerCommand("ajax-image", () => {
			this.queue.push({
				url: "/_ajax/image",
				disableCache: true,
				success: (response) => console.log("success ajax-image")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-delay" }, "response delay")));
		this.registerCommand("ajax-delay", () => {
			this.queue.push({
				url: "/_ajax/delay",
				disableCache: true,
				success: (response) => console.log("success ajax-delay"),
				error: (request, reason) => alert(reason)
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-timeout" }, "response timeout")));
		this.registerCommand("ajax-timeout", () => {
			this.queue.push({
				url: "/_ajax/delay",
				disableCache: true,
				timeout: 1000,
				success: (response) => console.log("success ajax-timeout"),
				error: (request, reason) => alert(reason)
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "reset-current" }, "reset queue with current")));
		this.registerCommand("reset-current", () => this.queue.reset(true));

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "reset" }, "reset queue")));
		this.registerCommand("reset", () => this.queue.reset());

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "destroy" }, "destroy queue")));
		this.registerCommand("destroy", () => this.queue.destroy());
	}
}