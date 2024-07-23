import { DOM } from "@brandup/ui-dom";
import { request } from "@brandup/ui-ajax";
import { Page } from "./base";

export default class NavigationPage extends Page {
	get typeName(): string { return "AboutModel" }
	get header(): string { return "Commands" }

	protected async onRenderContent(container: HTMLElement) {
		const html = await import("./templates/commands.html");
		container.insertAdjacentHTML("beforeend", html.default);

		this.element?.addEventListener("uicommand", (e) => console.warn(e));
		this.onDestroy(() => console.warn("destroy page"));

		this.registerCommand("command1", (context) => { context.target.innerHTML = "ok"; });
		this.registerCommand("command1-cant", (context) => { context.target.innerHTML = "ok"; }, () => { return false; });
		this.registerCommand("command2", (context) => { context.transparent = true; context.target.innerHTML = "ok"; });
		this.registerCommand("command2-cant", (context) => { context.target.innerHTML = "ok"; }, () => { return false; });
		this.registerCommand("command-svg", (context) => { context.target.innerHTML = "ok"; });

		this.registerCommand("command1-async", (context) => {
			return new Promise<void>(resolve => {
				context.target.innerHTML = "Loading...";

				window.setTimeout(() => {
					context.target.innerHTML = "Ok";
					resolve();
				}, 2000);
			});
		});

		this.registerCommand("command-dom1", (context) => {
			context.target.insertAdjacentElement("afterend", DOM.tag("div", "test", "test"));
			return Promise.resolve();
		});

		this.registerCommand("command-dom2", (context) => {
			const elem = DOM.tag("div", {
				class: ["test1", "test2"],
				dataset: { test: "test" },
				styles: { display: "block" },
				events: { "click": () => alert(elem.dataset["test"]) },
				id: "test",
				command: "test1000"
			}, "test");

			context.target.insertAdjacentElement("afterend", elem);
			return Promise.resolve();
		});

		this.registerCommand("test1000", () => {
			this.destroy();
		});

		this.registerCommand("command-dom3", async (context) => {
			const module = await import('./modules/test');
			module.Test(context.target);
		});

		this.registerCommand("upload-file", (context) => {
			return new Promise<void>(resolve => {
				const input = <HTMLInputElement>DOM.tag("input", { type: "file" });
				input.click();

				input.addEventListener("change", () => {
					if (!input.files || input.files.length !== 1) {
						resolve();
						return;
					}

					request({
						query: { handler: "UploadFile" },
						method: "POST",
						data: input.files.item(0)
					})
						.then(response => {
							if (response.status == 200)
								alert(JSON.stringify(response.data));
							else
								alert(response.status);
						})
						.finally(() => resolve());
				});

				input.addEventListener("cancel", () => resolve());
			});
		});

		this.registerCommand("upload-form", () => {
			return new Promise<void>(resolve => {
				const input = <HTMLInputElement>DOM.tag("input", { type: "file", name: "file" });
				const form = <HTMLFormElement>DOM.tag("form", { enctype: "multipart/form-data" }, input);
				input.click();

				input.addEventListener("change", () => {
					if (!input.files || input.files.length !== 1) {
						resolve();
						return;
					}

					request({
						query: { handler: "UploadForm" },
						method: "POST",
						data: form
					})
						.then((response) => {
							if (response.status == 200) {
								alert(JSON.stringify(response.data));
							}
							else
								alert(response.state);
						})
						.finally(() => resolve());
				});

				input.addEventListener("cancel", () => resolve());
			});
		});
	}
}