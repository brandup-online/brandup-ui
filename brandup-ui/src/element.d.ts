export declare const elemAttributeName = "brandup-ui-element";
export declare const elemPropertyName = "brandupUiElement";
export declare abstract class UIElement {
    private __element;
    private __events;
    private __commandHandlers;
    private __exts;
    private __isExt;
    abstract typeName: string;
    readonly element: HTMLElement;
    protected setElement(elem: HTMLElement): void;
    protected extElement(name: string, ownerElem: UIElement): void;
    private __addExtElem;
    getExt(name: string): UIElement;
    protected __createEvent(eventName: string, eventOptions?: IEventOptions): void;
    protected __raiseEvent(eventName: string, eventArgs?: any): boolean;
    addEventListener(eventName: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
    removeEventListener(eventName: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void;
    registerCommand(name: string, execute: (commandElem: HTMLElement) => void, canExecute?: (commandElem: HTMLElement) => boolean): void;
    execCommand(name: string, elem: HTMLElement): CommandsExecResult;
    protected _onCanExecCommands(): boolean;
    destroy(): void;
}
export interface IEventOptions {
    scoped?: boolean;
    bubbles?: boolean;
    cancelable?: boolean;
}
export interface IEventArgs {
}
export declare enum CommandsExecResult {
    NotFound = 0,
    NotAllow = 1,
    Success = 2
}
