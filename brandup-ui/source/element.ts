import Utility from "./utility";

export const ElemAttributeName = "brandup-ui-element";
export const ElemPropertyName = "brandupUiElement";

export enum CommandsExecResult {
    NotFound = 0,
    NotAllow = 1,
    Success = 2
}

export abstract class UIElement {
    private __element: HTMLElement;
    private __events: { [key: string]: IEventOptions } = {};
    private __commandHandlers: { [key: string]: ICommandHandler } = {};

    abstract typeName: string;
    get element(): HTMLElement { return this.__element; }
    protected setElement(elem: HTMLElement) {
        if (!elem)
            throw "Not set value elem.";

        if (this.__element || elem[ElemPropertyName])
            throw "UIElement already defined";

        this.__element = elem;

        this.__element[ElemPropertyName] = this;
        this.__element.setAttribute(ElemAttributeName, this.typeName);

        this.defineEvent("command", { cancelable: false, bubbles: true });
    }

    // HTMLElement Events
    protected defineEvent(eventName: string, eventOptions?: IEventOptions) {
        this.__events[eventName] = eventOptions ? eventOptions : null;
    }
    protected raiseEvent<T>(eventName: string, eventArgs?: T): boolean {
        if (!this.__events.hasOwnProperty(eventName))
            throw `Not found event "${eventName}".`;

        const eventOptions = this.__events[eventName];

        const eventInit: CustomEventInit<T> = {};
        if (eventOptions) {
            if (eventOptions.bubbles)
                eventInit.bubbles = eventOptions.bubbles;
            if (eventOptions.cancelable)
                eventInit.cancelable = eventOptions.cancelable;
            if (eventOptions.composed)
                eventInit.composed = eventOptions.composed;
        }
        eventInit.detail = eventArgs ? eventArgs : null;

        const event = new CustomEvent<T>(eventName, eventInit);

        return this.dispatchEvent(event);
    }
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        this.__element.addEventListener(type, listener, options);
    }
    removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
        this.__element.removeEventListener(type, listener, options);
    }
    dispatchEvent(event: Event): boolean {
        return this.__element.dispatchEvent(event);
    }

    // Commands
    registerCommand(name: string, execute: (commandElem: HTMLElement, context: CommandExecutionContext) => void, canExecute: (commandElem: HTMLElement, context: CommandExecutionContext) => boolean = null) {
        const key = name.toLowerCase();
        if (this.__commandHandlers.hasOwnProperty(key))
            throw `Command "${name}" already registered.`;

        this.__commandHandlers[key] = {
            name: name,
            execute: Utility.createDelegate(this, execute),
            canExecute: canExecute ? Utility.createDelegate(this, canExecute) : null
        };
    }
    execCommand(name: string, elem: HTMLElement): { result: CommandsExecResult; context?: CommandExecutionContext } {
        const key = name.toLowerCase();
        if (!this.__commandHandlers.hasOwnProperty(key))
            return { result: CommandsExecResult.NotFound };

        if (!this._onCanExecCommands())
            return { result: CommandsExecResult.NotAllow };

        const context: CommandExecutionContext = {
            transparent: false
        };

        const handler = this.__commandHandlers[key];
        if (handler.canExecute && !handler.canExecute(elem, context))
            return { result: CommandsExecResult.NotAllow, context: context };

        this.raiseEvent<any>("command", handler.name);

        handler.execute(elem, context);

        return { result: CommandsExecResult.Success, context: context };
    }

    protected _onCanExecCommands(): boolean {
        return true;
    }

    destroy() {
        if (this.__element) {
            this.__element.removeAttribute(ElemAttributeName);
            delete this.__element[ElemPropertyName];

            this.__element = null;
        }
    }
}

const commandClickHandler = (e: MouseEvent) => {
    if (e.returnValue === false)
        return;

    let commandElem = e.target as HTMLElement;
    while (true) {
        if (commandElem.hasAttribute("data-command"))
            break;
        if (commandElem === e.currentTarget)
            return;

        if (typeof commandElem.parentElement === "undefined")
            commandElem = commandElem.parentNode as HTMLElement;
        else
            commandElem = commandElem.parentElement;
        if (!commandElem)
            return;
    }

    let controlElem: HTMLElement = commandElem;
    while (true) {
        while (controlElem) {
            if (controlElem.hasAttribute(ElemAttributeName)) {
                break;
            }

            if (typeof controlElem.parentElement === "undefined")
                commandElem = controlElem.parentNode as HTMLElement;
            else
                controlElem = controlElem.parentElement;
        }

        if (!controlElem)
            break;

        const uiElem: UIElement = controlElem ? controlElem[ElemPropertyName] : this;

        const commandName = commandElem.getAttribute("data-command");
        const res = uiElem.execCommand(commandName, commandElem);
        if (res.result === CommandsExecResult.Success) {
            if (res.context.transparent)
                return;
        }

        if (res.result === CommandsExecResult.NotFound) {
            controlElem = controlElem.parentElement;
            continue;
        }

        break;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    return false;
}

window.addEventListener("click", commandClickHandler, false);

(function () {
    if (typeof window["CustomEvent"] === "function") return false; //If not IE

    const customEvent = function (event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };

    customEvent.prototype = window["Event"].prototype;

    (window as object)["CustomEvent"] = customEvent;
})();

export interface IEventOptions {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
}

interface ICommandHandler {
    name: string;
    execute: (elem: HTMLElement, context: CommandExecutionContext) => void;
    canExecute: (elem: HTMLElement, context: CommandExecutionContext) => boolean;
}

export interface CommandExecutionContext {
    transparent?: boolean;
}