import { DOM } from "brandup-ui-dom";
import { REALTIME_NAME, RealtimeMiddleware } from "../middlewares/realtime";
import { Page } from "./base";
import { CommandContext } from "brandup-ui";
import { ajaxRequest } from "brandup-ui-ajax";

export default class IndexModel extends Page {
	get typeName(): string { return "IndexModel" }
	get header(): string { return "Main" }

	protected async onRenderContent(container: HTMLElement) {
		container.appendChild(DOM.tag("div", "page-content", `
			<div class="list">
				<div class="item"><a href="" data-command="command1"><b>command</b></a></div>
				<div class="item"><a href="" data-command="command1-cant">command (cant exec)</a></div>
				<div class="item"><a href="" data-command="command2">transparent command</a></div>
				<div class="item"><a href="" data-command="command2-cant">transparent command (cant exec)</a></div>
				<div class="item">
					<a href="" data-command="command-svg">
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" width="26" height="26">
							<path d="M 7.71875 4.0625 C 4.35767 4.0625 1.625 6.8269 1.625 10.1562 C 1.625 11.3179 2.15186 12.324 2.64062 13.0508 C 3.12939 13.7776 3.63086 14.2441 3.63086 14.2441 L 12.416 23.0547 L 13 23.6387 L 13.584 23.0547 L 22.3691 14.2441 C 22.3691 14.2441 24.375 12.4763 24.375 10.1562 C 24.375 6.8269 21.6423 4.0625 18.2812 4.0625 C 15.4915 4.0625 13.6951 5.74145 13 6.44922 C 12.3049 5.74145 10.5085 4.0625 7.71875 4.0625 Z M 7.71875 5.6875 C 10.1467 5.6875 12.3906 8.04883 12.3906 8.04883 L 13 8.73438 L 13.6094 8.04883 C 13.6094 8.04883 15.8533 5.6875 18.2812 5.6875 C 20.7537 5.6875 22.75 7.71558 22.75 10.1562 C 22.75 11.4099 21.2266 13.1016 21.2266 13.1016 L 13 21.3281 L 4.77344 13.1016 C 4.77344 13.1016 4.37988 12.7239 3.98633 12.1367 C 3.59277 11.5496 3.25 10.7847 3.25 10.1562 C 3.25 7.71558 5.24634 5.6875 7.71875 5.6875 Z" />
						</svg>
					</a>
				</div>
				<div class="item"><a href="" data-command="command3">command (not exist)</a></div>
				<div class="item"><a href="" data-command="command1-async"><b>command async</b></a></div>

				<div class="item"><a href="" data-command="command-dom1"><b>DOM.tag with class</b></a></div>
				<div class="item"><a href="" data-command="command-dom2"><b>DOM.tag with options</b></a></div>
				<div class="item"><a href="" data-command="command-dom3"><b>async load module</b></a></div>

				<div class="item"><a href="" data-command="upload-file"><b>upload file</b></a></div>
				<div class="item"><a href="" data-command="upload-form"><b>upload form</b></a></div>
			</div>`));

		this.app.middleware<RealtimeMiddleware>(REALTIME_NAME).subscribe("main");

		this.registerCommand("command1", (elem: HTMLElement) => { elem.innerHTML = "ok"; });
		this.registerCommand("command1-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
		this.registerCommand("command2", (elem: HTMLElement, context: CommandContext) => { context.transparent = true; elem.innerHTML = "ok"; });
		this.registerCommand("command2-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
		this.registerCommand("command-svg", (elem: HTMLElement) => { elem.innerHTML = "ok"; });

		this.registerAsyncCommand("command1-async", (context) => {
			context.timeout = 3000;

			context.target.innerHTML = "Loading...";
			const t = window.setTimeout(() => {
				context.target.innerHTML = "Ok";
				context.complate();
			}, 2000);

			context.timeoutCallback = () => {
				clearTimeout(t);
			};
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

		this.registerAsyncCommand("command-dom3", (context) => {
			import('./modules/test')
				.then((m) => {
					m.Test(context.target);
					context.complate();
				})
				.catch(() => {
					context.target.innerText = "error";
					context.complate();
				});
		});

		this.registerCommand("upload-file", () => {
			const input = <HTMLInputElement>DOM.tag("input", { type: "file" });
			input.click();

			input.addEventListener("change", () => {
				if (!input.files || !input.files.length)
					return;

				ajaxRequest({
					query: { handler: "UploadFile" },
					method: "POST",
					data: input.files.item(0),
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