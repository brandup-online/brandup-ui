import * as common from "./common"

export const ElemAttributeName = "brandup-ui-element";
export const ElemPropertyName = "brandupUiElement";

export abstract class UIElement {
    private __element: HTMLElement;
    private __events: { [key: string]: IEventOptions; } = {};
    private __commandHandlers: { [key: string]: ICommandHandler; } = {};
    
    abstract typeName: string;
    get element(): HTMLElement {
        return this.__element;
    }
    protected setElement(elem: HTMLElement) {
        if (!elem)
            throw "Not set value elem.";
        
        if (this.__element || elem[ElemPropertyName])
            throw "UIElement already defined";

        this.__element = elem;

        this.__element[ElemPropertyName] = this;
        this.__element.setAttribute(ElemAttributeName, this.typeName);

        //elem.addEventListener("DOMNodeRemoved", () => this.destroy());
    }
    
    // HTMLElement Events
    protected __createEvent(eventName: string, eventOptions?: IEventOptions) {
        this.__events[eventName] = eventOptions ? eventOptions : null;
    }
    protected __raiseEvent(eventName: string, eventArgs?: any): boolean {
        //if (!this.options.enable)
        //    return false;

        if (!this.__events.hasOwnProperty(eventName))
            throw new Error();

        var eventOptions = this.__events[eventName];

        var eventInit: CustomEventInit<IEventArgs> = {};
        if (eventOptions) {
            if (eventOptions.bubbles)
                eventInit.bubbles = eventOptions.bubbles;
            if (eventOptions.cancelable)
                eventInit.cancelable = eventOptions.cancelable;
            //if (eventOptions.scoped)
            //    eventInit.scoped = eventOptions.scoped;
        }
        eventInit.detail = eventArgs ? eventArgs : null;

        var event = new CustomEvent<IEventArgs>(eventName, eventInit);

        return this.__element.dispatchEvent(event);
    }
    addEventListener(eventName: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean) {
        this.__element.addEventListener(eventName, listener, useCapture);
    }
    removeEventListener(eventName: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean) {
        this.__element.removeEventListener(eventName, listener, useCapture);
    }

    // Commands
    registerCommand(name: string, execute: (commandElem: HTMLElement) => void, canExecute: (commandElem: HTMLElement) => boolean = null) {
        if (this.__commandHandlers.hasOwnProperty(name))
            throw new Error("Команда уже существует.");

        this.__commandHandlers[name] = <ICommandHandler>{
            execute: common.Utility.createDelegate(this, execute),
            canExecute: canExecute ? common.Utility.createDelegate(this, canExecute) : null
        };

        this.__createEvent(name, {});
    }
    execCommand(name: string, elem: HTMLElement): CommandsExecResult {
        if (!this.__commandHandlers.hasOwnProperty(name))
            return CommandsExecResult.NotFound;

        if (!this._onCanExecCommands())
            return CommandsExecResult.NotAllow;

        var handler = this.__commandHandlers[name];
        if (handler.canExecute && !handler.canExecute(elem))
            return CommandsExecResult.NotAllow;

        this.__raiseEvent(name);

        handler.execute(elem);

        return CommandsExecResult.Success;
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
        if (res == CommandsExecResult.NotFound) {
            controlElem = controlElem.parentElement;
            continue;
        }
        break;
    }

    e.preventDefault();
    e.returnValue = false;

    return false;
}

document.body.addEventListener("click", commandClickHandler, false);

export interface IEventOptions {
    scoped?: boolean;
    bubbles?: boolean;
    cancelable?: boolean;
}
export interface IEventArgs {
}

export enum CommandsExecResult {
    NotFound = 0,
    NotAllow = 1,
    Success = 2
}
interface ICommandHandler {
    execute: (elem: HTMLElement) => void;
    canExecute: (elem: HTMLElement) => boolean;
}