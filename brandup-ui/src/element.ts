import * as common from "./common"

export const elemAttributeName = "brandup-ui-element";
export const elemPropertyName = "brandupUiElement";

export abstract class UIElement {
    private __element: HTMLElement;
    private __events: { [key: string]: IEventOptions; } = {};
    private __commandHandlers: { [key: string]: ICommandHandler; } = {};
    private __exts: { [key: string]: UIElement; };
    private __isExt: boolean;
    
    abstract typeName: string;
    get element(): HTMLElement {
        return this.__element;
    }
    protected setElement(elem: HTMLElement) {
        if (this.__element)
            throw new Error();
        if (elem[elemPropertyName])
            throw new Error("UIElement already defined");

        this.__element = elem;

        this.__element[elemPropertyName] = this;
        this.__element.setAttribute(elemAttributeName, this.typeName);

        elem.addEventListener("DOMNodeRemoved", () => this.destroy());
    }
    protected extElement(name: string, ownerElem: UIElement) {
        if (this.__element)
            throw new Error();
        if (ownerElem.__isExt)
            throw new Error();

        this.__element = ownerElem.element;
        this.__isExt = true;
        ownerElem.__addExtElem(name, this);
    }

    private __addExtElem(name: string, elem: UIElement) {
        if (!this.__exts)
            this.__exts = {};

        this.__exts[name] = elem;
    }
    getExt(name: string): UIElement {
        if (!this.__exts)
            return null;
        var elem = this.__exts[name];
        return elem ? elem : null;
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
        if (!this.__commandHandlers.hasOwnProperty(name)) {
            if (this.__exts) {
                for (let key in this.__exts) {
                    var r = this.__exts[key].execCommand(name, elem);
                    if (r !== CommandsExecResult.NotFound)
                        return r;
                }
            }

            return CommandsExecResult.NotFound;
        }

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
            if (this.__exts) {
                for (var key in this.__exts) {
                    this.__exts[key].destroy();
                }
                this.__exts = null;
            }

            if (!this.__isExt) {
                this.__element.removeAttribute(elemAttributeName);
                delete this.__element[elemPropertyName];
            }

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
            if (controlElem.hasAttribute("bbpm")) {
                break;
            }
            controlElem = controlElem.parentElement;
        }

        if (!controlElem)
            break;

        var uiElem: UIElement = controlElem ? controlElem["bbpmElem"] : this;

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