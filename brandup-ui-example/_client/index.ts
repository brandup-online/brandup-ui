import { UIElement, CommandContext } from "brandup-ui";
import { ajaxRequest } from "brandup-ui-ajax";
import { DOM } from "brandup-ui-dom";
import "./styles.less";

export class AppElem extends UIElement {
    get typeName(): string { return "AppElem"; }

    constructor() {
        super();

        this.setElement(document.body);
    }

    protected _onRenderElement() {
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
                if (!input.files.length)
                    return;

                ajaxRequest({
                    url: "",
                    urlParams: { handler: "UploadFile" },
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
                    url: "",
                    urlParams: { handler: "UploadForm" },
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

document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
        new AppElem();
    }
});