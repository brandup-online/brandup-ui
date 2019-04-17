import { UIElement } from "./element";
export declare abstract class UIControl<TOptions> extends UIElement {
    readonly options: TOptions;
    private __fragment;
    readonly isInject: boolean;
    constructor(options?: TOptions, element?: HTMLElement);
    protected _onApplyDefaultOptions(): void;
    protected _applyOptions<TOptions>(options: TOptions): void;
    protected _getTagName(): string;
    protected _getHtmlTemplate(): string;
    protected abstract _onRender(): any;
    render(container: HTMLElement | string, position?: InsertPosition): this;
    destroy(): void;
    protected _onInitialize(): void;
}
