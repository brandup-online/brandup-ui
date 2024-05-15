import { DOM } from "brandup-ui-dom";
import { PageModel } from "./base";

export default class AboutModel extends PageModel {
    get typeName(): string { return "AboutModel" }
    get header(): string { return "About" }

    protected _onRenderElement(element: HTMLElement) {
        super._onRenderElement(element);

        element.appendChild(DOM.tag("p", null, "About page content."));

        element.appendChild(DOM.tag("form", { class: "appform", method: "post", action: this.app.uri("/send") }, [
            DOM.tag("input", { type: "text", name: "value" }),
            DOM.tag("button", { type: "submit" }, "Send")
        ]));
    }
}