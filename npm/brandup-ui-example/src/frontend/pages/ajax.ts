import { DOM } from "@brandup/ui-dom";
import { Page } from "./base";
import { AjaxQueue } from "@brandup/ui-ajax";
import { ExampleApplication } from "frontend/app";
import { NavigateContext } from "@brandup/ui-app";

export default class AjaxPage extends Page {
	get typeName(): string { return "AjaxPage" }
	get header(): string { return "AJAX" }

	readonly queue: AjaxQueue;

	constructor(context: NavigateContext) {
		super(context);

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
		this.registerCommand("empty-url", async () => {
			await this.queue.enque({
				success: () => console.log("success empty-url")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "can-request" }, "can request")));
		this.registerCommand("can-request", () => {
			return this.queue.enque({
				url: "?can-request",
				success: () => console.log("success can-request")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "send-json" }, "send json")));
		this.registerCommand("send-json", () => {
			return this.queue.enque({
				method: "POST",
				url: "/_ajax/send-json",
				data: { test: "test" },
				disableCache: true,
				success: () => console.log("success send-json")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "redirect-internal" }, "redirect")));
		this.registerCommand("redirect-internal", () => {
			return this.queue.enque({
				url: "/_ajax/redirect",
				disableCache: true,
				success: () => console.log("success redirect-internal")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "redirect-external" }, "redirect external")));
		this.registerCommand("redirect-external", () => {
			return this.queue.enque({
				url: "https://wsender.ru",
				disableCache: true,
				success: () => console.log("success redirect-external")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-json" }, "response json")));
		this.registerCommand("ajax-json", () => {
			return this.queue.enque({
				url: "/_ajax/json",
				disableCache: true,
				success: () => console.log("success ajax-json")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-html" }, "response html")));
		this.registerCommand("ajax-html", async () => {
			await this.queue.enque({ url: "/_ajax/html", disableCache: true });

			console.log("success ajax-html");
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-text" }, "response text")));
		this.registerCommand("ajax-text", () => {
			return this.queue.enque({
				url: "/_ajax/text",
				disableCache: true,
				success: () => console.log("success ajax-text")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-image" }, "response image")));
		this.registerCommand("ajax-image", () => {
			return this.queue.enque({
				url: "/_ajax/image",
				disableCache: true,
				success: () => console.log("success ajax-image")
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-delay" }, "response delay")));
		this.registerCommand("ajax-delay", () => {
			return this.queue.enque({
				url: "/_ajax/delay",
				disableCache: true,
				success: () => console.log("success ajax-delay"),
				error: (request, reason) => alert(reason)
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "ajax-timeout" }, "response timeout")));
		this.registerCommand("ajax-timeout", () => {
			return this.queue.enque({
				url: "/_ajax/delay",
				disableCache: true,
				timeout: 1000,
				success: () => console.log("success ajax-timeout"),
				error: (request, reason) => alert(reason)
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "send-headers" }, "send headers")));
		this.registerCommand("send-headers", () => {
			return this.queue.enque({
				method: "POST",
				url: "/_ajax/send-json",
				headers: { aaa: "aaa" },
				data: { test: "test" },
				disableCache: true,
				success: () => console.log("success send-headers"),
				error: (request, reason) => alert(reason)
			});
		});

		container.appendChild(DOM.tag("div", null, DOM.tag("a", { href: "", command: "response-headers" }, "get response headers")));
		this.registerCommand("response-headers", () => {
			return this.queue.enque({
				url: "/_ajax/image",
				disableCache: true,
				success: (response) => {
					let headers = "";
					response.headers.forEach((v, k) => {
						headers += `${k}: ${v}\n`
					});
					alert(headers);
				},
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