import { Utility } from "./utility";

export const ElemAttributeName = "brandup-ui-element";
export const ElemPropertyName = "brandupUiElement";

export type commandExecuteDelegate = (elem: HTMLElement, context: CommandExecutionContext) => void;
export type commandCanExecuteDelegate = (elem: HTMLElement, context: CommandExecutionContext) => boolean;

export enum CommandsExecStatus {
    NotAllow = 1,
    Success = 2
}

export abstract class UIElement {
    private __element: HTMLElement;
    private __events: { [key: string]: EventOptions } = {};
    private __commandHandlers: { [key: string]: CommandHandler } = {};

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

        this._onRender(elem);
    }

    // HTMLElement Events
    protected defineEvent(eventName: string, eventOptions?: EventOptions) {
        this.__events[eventName] = eventOptions ? eventOptions : null;
    }
    protected raiseEvent<T = {}>(eventName: string, eventArgs?: T): boolean {
        if (!(eventName in this.__events))
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
    registerCommand(name: string, execute: commandExecuteDelegate, canExecute: commandCanExecuteDelegate = null) {
        const key = name.toLowerCase();
        if (key in this.__commandHandlers)
            throw `Command "${name}" already registered.`;

        this.__commandHandlers[key] = {
            name: name,
            execute: Utility.createDelegate(this, execute),
            canExecute: canExecute ? Utility.createDelegate(this, canExecute) : null
        };
    }
    hasCommand(name: string) {
        return name.toLowerCase() in this.__commandHandlers;
    }
    execCommand(name: string, elem: HTMLElement): { result: CommandsExecStatus; context?: CommandExecutionContext } {
        const key = name.toLowerCase();
        if (!(key in this.__commandHandlers))
            throw `Command "${name}" is not registered.`;

        if (!this._onCanExecCommand(name, elem))
            return { result: CommandsExecStatus.NotAllow };

        const context: CommandExecutionContext = {
            transparent: false
        };

        const handler = this.__commandHandlers[key];
        if (handler.canExecute && !handler.canExecute(elem, context))
            return { result: CommandsExecStatus.NotAllow, context: context };

        this.raiseEvent<CommandEventArgs>("command", {
            name: handler.name,
            uiElem: this,
            elem: this.__element
        });

        handler.execute(elem, context);

        return { result: CommandsExecStatus.Success, context: context };
    }

    protected _onRender(_elem: HTMLElement) {
        return;
    }
    protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean {
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

const fundUiElementByCommand = (elem: HTMLElement, commandName: string): UIElement => {
    while (elem) {
        if (elem.hasAttribute(ElemAttributeName)) {
            const uiElem: UIElement = elem[ElemPropertyName];
            if (uiElem.hasCommand(commandName))
                return uiElem;
        }

        if (typeof elem.parentElement === "undefined")
            elem = elem.parentNode as HTMLElement;
        else
            elem = elem.parentElement;
    }

    return null;
};
const commandClickHandler = (e: MouseEvent) => {
    if (e.returnValue === false)
        return;

    let commandElem = e.target as HTMLElement;
    while (commandElem) {
        if (commandElem.hasAttribute("data-command"))
            break;

        if (commandElem === e.currentTarget)
            return;

        if (typeof commandElem.parentElement === "undefined")
            commandElem = commandElem.parentNode as HTMLElement;
        else
            commandElem = commandElem.parentElement;
    }

    if (!commandElem)
        return;

    const commandName = commandElem.getAttribute("data-command");

    const uiElem = fundUiElementByCommand(commandElem, commandName);
    const commandResult = uiElem.execCommand(commandName, commandElem);
    if (commandResult.context.transparent)
        return;

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

export interface EventOptions {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
}

interface CommandHandler {
    name: string;
    execute: commandExecuteDelegate;
    canExecute: commandCanExecuteDelegate;
}

export interface CommandEventArgs {
    name: string;
    uiElem: UIElement;
    elem: HTMLElement;
}

export interface CommandExecutionContext {
    transparent?: boolean;
}