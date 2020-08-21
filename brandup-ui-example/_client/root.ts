import { UIElement, CommandExecutionContext} from "brandup-ui";
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
    }
}

document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
        new AppElem();
    }
});