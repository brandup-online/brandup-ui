import { UIElement, CommandExecutionContext, DOM} from "brandup-ui";
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
        this.registerCommand("command2", (elem: HTMLElement, context: CommandExecutionContext) => { context.transparent = true; elem.innerHTML = "ok"; });
        this.registerCommand("command2-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
        this.registerCommand("command-svg", (elem: HTMLElement) => { elem.innerHTML = "ok"; });

        this.registerAsyncCommand("command1-async", (context) => {
            context.timeout = 1000;

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
                id: "test"
            }, "test");

            context.target.insertAdjacentElement("afterend", elem);
            context.complate();
        });
    }
}

document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
        new AppElem();
    }
});