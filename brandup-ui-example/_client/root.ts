import "./styles.less";
import { UIElement, UIControl, DOM, ajaxRequest, AjaxQueue, AJAXMethod, Utility, CommandsExecResult, CommandExecutionContext } from "brandup-ui";

export class Elem extends UIControl<any> {
    get typeName(): string { return "Elem2"; }

    protected _onRender() {
        this.registerCommand("command1", (elem: HTMLElement) => { elem.innerHTML = "ok"; });
        this.registerCommand("command1-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
        this.registerCommand("command2", (elem: HTMLElement, context: CommandExecutionContext) => { context.transparent = true; elem.innerHTML = "ok"; });
        this.registerCommand("command2-cant", (elem: HTMLElement) => { elem.innerHTML = "ok"; }, () => { return false; });
    }
}

document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
        var elem = new Elem(null, document.body);
        elem.render(null);
    }
});