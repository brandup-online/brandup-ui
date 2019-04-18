import { Utility } from "./common";
import { UIElement } from "./element";

export abstract class UIControl<TOptions> extends UIElement {
    readonly options: TOptions = <TOptions>{};
    private __fragment: DocumentFragment;

    readonly isInject: boolean = false;

    constructor(options?: TOptions, element?: HTMLElement) {
        super();

        var tagName = this._getTagName();
        if (!tagName)
            throw new Error();

        if (!element) {
            this.__fragment = document.createDocumentFragment();
            element = document.createElement(tagName);
            this.__fragment.appendChild(element);
        }
        else
            this.isInject = true;

        this.setElement(element);

        this._onApplyDefaultOptions();
        this._applyOptions(options);

        this._onInitialize();
    }

    // Options
    protected _onApplyDefaultOptions() {
    }
    protected _applyOptions<TOptions>(options: TOptions) {
        if (options)
            Utility.extend(this.options, options);
    }

    // Render
    protected _getTagName(): string {
        return "div";
    }
    protected _getHtmlTemplate(): string {
        return null;
    }
    render(container: HTMLElement | string, position: InsertPosition = "afterbegin"): this {
        if (container) {
            if (!this.__fragment)
                throw new Error();

            if (Utility.isString(container)) {
                container = document.getElementById((<string>container).substr(1));
                if (!container)
                    throw new Error();
            }
        }

        var htmlTemplate = this._getHtmlTemplate();
        if (htmlTemplate)
            this.element.insertAdjacentHTML(position, htmlTemplate);

        if (this.__fragment) {
            (<HTMLElement>container).appendChild(this.__fragment);
            delete this.__fragment;
        }

        this._onRender();

        return this;
    }
    destroy() {
        if (!this.isInject && this.element)
            this.element.remove();

        super.destroy();
    }

    protected _onInitialize() { }
    protected abstract _onRender();
}