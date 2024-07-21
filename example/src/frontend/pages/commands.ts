import { DOM } from "@brandup/ui-dom";
import { Page } from "./base";
import { CommandContext } from "@brandup/ui";
import { ajaxRequest, request } from "@brandup/ui-ajax";

export default class NavigationPage extends Page {
	get typeName(): string { return "AboutModel" }
	get header(): string { return "Commands" }

	protected async onRenderContent(container: HTMLElement) {
		const html = await import("./templates/commands.html");
		container.insertAdjacentHTML("beforeend", html.default);

		this.registerCommand("command1", (elem: HTMLElement) => { elem.innerHTML = "ok"; });
		this.registerCommand("command1-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
		this.registerCommand("command2", (elem: HTMLElement, context: CommandContext) => { context.transparent = true; elem.innerHTML = "ok"; });
		this.registerCommand("command2-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
		this.registerCommand("command-svg", (elem: HTMLElement) => { elem.innerHTML = "ok"; });

		this.registerAsyncCommand("command1-async", (context) => {
			context.timeout = 3000;

			return new Promise<void>(resolve => {
				context.target.innerHTML = "Loading...";

				const t = window.setTimeout(() => {
					context.target.innerHTML = "Ok";
					resolve();
				}, 2000);

				context.timeoutCallback = () => window.clearTimeout(t);
			});
		});

		this.registerAsyncCommand("command-dom1", (context) => {
			context.target.insertAdjacentElement("afterend", DOM.tag("div", "test", "test"));
			context.complate();
		});

		this.registerAsyncCommand("command-dom2", (context) => {
			const elem = DOM.tag("div", {
				class: ["test1", "test2"],
				dataset: { test: "test" },
				styles: { display: "block" },
				events: { "click": () => alert(elem.dataset["test"]) },
				id: "test",
				command: "test1000"
			}, "test");

			context.target.insertAdjacentElement("afterend", elem);
			context.complate();
		});

		this.registerCommand("test1000", () => {
			this.destroy();
		});

		this.registerAsyncCommand("command-dom3", async (context) => {
			const module = await import('./modules/test');
			module.Test(context.target);
		});

		this.registerAsyncCommand("upload-file", (context) => {
			context.timeout = 0;

			const input = <HTMLInputElement>DOM.tag("input", { type: "file" });
			input.click();

			input.addEventListener("change", () => {
				if (!input.files || input.files.length !== 1) {
					context.complate();
					return;
				}

				request({
					query: { handler: "UploadFile" },
					method: "POST",
					data: input.files.item(0)
				}).then(response => {
					if (response.status == 200)
						alert(JSON.stringify(response.data));
					else
						alert(response.status);
				}).finally(() => context.complate());
			});

			input.addEventListener("cancel", () => context.complate());
		});

		this.registerCommand("upload-form", () => {
			const input = <HTMLInputElement>DOM.tag("input", { type: "file", name: "file" });
			const form = <HTMLFormElement>DOM.tag("form", { enctype: "multipart/form-data" }, input);
			input.click();

			input.addEventListener("change", () => {
				ajaxRequest({
					query: { handler: "UploadForm" },
					method: "POST",
					data: form,
					success: (response) => {
						if (response.status == 200) {
							alert(JSON.stringify(response.data));
						}
						else
							alert(response.state);
					}
				});
			});
		});
	}
}