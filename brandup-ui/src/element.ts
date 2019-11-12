import * as common from "./common"

export const ElemAttributeName = "brandup-ui-element";
export const ElemPropertyName = "brandupUiElement";

export abstract class UIElement {
    private __element: HTMLElement;
    private __events: { [key: string]: IEventOptions; } = {};
    private __commandHandlers: { [key: string]: ICommandHandler; } = {};

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

        var eventOptions = this.__events[eventName];

        var eventInit: CustomEventInit<T> = {};
        if (eventOptions) {
            if (eventOptions.bubbles)
                eventInit.bubbles = eventOptions.bubbles;
            if (eventOptions.cancelable)
                eventInit.cancelable = eventOptions.cancelable;
            if (eventOptions.composed)
                eventInit.composed = eventOptions.composed;
        }
        eventInit.detail = eventArgs ? eventArgs : null;

        var event = new CustomEvent<T>(eventName, eventInit);

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
        var key = name.toLowerCase();
        if (this.__commandHandlers.hasOwnProperty(key))
            throw `Command "${name}" already registered.`;

        this.__commandHandlers[key] = {
            name: name,
            execute: common.Utility.createDelegate(this, execute),
            canExecute: canExecute ? common.Utility.createDelegate(this, canExecute) : null
        };
    }
    execCommand(name: string, elem: HTMLElement): { result: CommandsExecResult, context?: CommandExecutionContext } {
        var key = name.toLowerCase();
        if (!this.__commandHandlers.hasOwnProperty(key))
            return { result: CommandsExecResult.NotFound };

        if (!this._onCanExecCommands())
            return { result: CommandsExecResult.NotAllow };

        var context: CommandExecutionContext = {
            transparent: false
        };

        var handler = this.__commandHandlers[key];
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

var commandClickHandler = (e: MouseEvent) => {
    if (e.returnValue === false)
        return;

    var commandElem = <HTMLElement>e.target;
    while (true) {
        if (commandElem.hasAttribute("data-command"))
            break;
        if (commandElem === e.currentTarget)
            return;

        commandElem = commandElem.parentElement;
        if (!commandElem)
            return;
    }

    var controlElem: HTMLElement = commandElem;
    while (true) {
        while (controlElem) {
            if (controlElem.hasAttribute(ElemAttributeName)) {
                break;
            }
            controlElem = controlElem.parentElement;
        }

        if (!controlElem)
            break;

        var uiElem: UIElement = controlElem ? controlElem[ElemPropertyName] : this;

        var commandName = commandElem.getAttribute("data-command");
        var res = uiElem.execCommand(commandName, commandElem);
        if (res.result == CommandsExecResult.Success) {
            if (res.context.transparent)
                return;
        }

        if (res.result == CommandsExecResult.NotFound) {
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

    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window["Event"].prototype;

    window["CustomEvent"] = CustomEvent;
})();

export interface IEventOptions {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
}

export enum CommandsExecResult {
    NotFound = 0,
    NotAllow = 1,
    Success = 2
}
interface ICommandHandler {
    name: string;
    execute: (elem: HTMLElement, context: CommandExecutionContext) => void;
    canExecute: (elem: HTMLElement, context: CommandExecutionContext) => boolean;
}

export interface CommandExecutionContext {
    transparent?: boolean;
}