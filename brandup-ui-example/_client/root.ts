import { CommandExecutionContext, DOM, UIElement } from "brandup-ui";
import "./styles.less";

export class AppElem extends UIElement {
    get typeName(): string { return "AppElem"; }

    constructor() {
        super();

        this.setElement(document.body);
    }

    protected _onRender() {
        this.registerCommand("command1", (elem: HTMLElement) => { elem.innerHTML = "ok"; });
        this.registerCommand("command1-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
        this.registerCommand("command2", (elem: HTMLElement, context: CommandExecutionContext) => { context.transparent = true; elem.innerHTML = "ok"; });
        this.registerCommand("command2-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
        this.registerCommand("command-svg", (elem: HTMLElement) => { elem.innerHTML = "ok"; });
    }
}

document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
        new AppElem();
    }
});