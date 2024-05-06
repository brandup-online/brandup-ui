import { UIElement } from "brandup-ui";
import { Application } from "brandup-ui-app";
import { DOM } from "brandup-ui-dom";

export abstract class PageModel extends UIElement {
    readonly app: Application;
    abstract get header(): string;

    constructor(app: Application, containerElement: HTMLElement) {
        super();

        this.app = app;
        this.setElement(containerElement);
    }

    protected _onRenderElement(element: HTMLElement) {
        element.appendChild(DOM.tag("header", "page-header", [
            DOM.tag("h1", null, this.header)
        ]));
    }

    destroy() {
        DOM.empty(this.element);

        super.destroy();
    }
}