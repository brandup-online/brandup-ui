import { UIControl, CommandExecutionContext } from "brandup-ui";
import "./styles.less";

export class Elem extends UIControl<object> {
    get typeName(): string { return "Elem2"; }

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
        const elem = new Elem(null, document.body);
        elem.render(null);
    }
});