export const ElemAttributeName = "uiElement";
export const ElemPropertyName = "brandupUiElement";
export const CommandAttributeName = "command";
export const CommandExecutingCssClassName = "executing";

export type CommandDelegate = (elem: HTMLElement, context: CommandContext) => void;
export type CommandCanExecuteDelegate = (elem: HTMLElement, context: CommandContext) => boolean;
export type CommandAsyncDelegate = (context: CommandAsyncContext) => void;

interface CommandHandler {
    name: string;
    execute?: CommandDelegate;
    canExecute?: CommandCanExecuteDelegate;
    delegate?: CommandAsyncDelegate;
    isExecuting: boolean;
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
        this.__element.dataset[ElemAttributeName] = this.typeName;

        this.defineEvent("command", { cancelable: false, bubbles: true });

        this._onRenderElement(elem);
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
    registerCommand(name: string, execute: CommandDelegate, canExecute: CommandCanExecuteDelegate = null) {
        name = this.verifyCommandName(name);

        this.__commandHandlers[name] = {
            name: name,
            execute,
            canExecute,
            isExecuting: false
        };
    }
    registerAsyncCommand(name: string, delegate: CommandAsyncDelegate, canExecute: CommandCanExecuteDelegate = null) {
        name = this.verifyCommandName(name);

        this.__commandHandlers[name] = {
            name: name,
            delegate,
            canExecute,
            isExecuting: false
        };
    }
    private verifyCommandName(name: string) {
        const key = name.toLowerCase();
        if (key in this.__commandHandlers)
            throw `Command "${name}" already registered.`;
        return key;
    }
    hasCommand(name: string) {
        return name.toLowerCase() in this.__commandHandlers;
    }
    execCommand(name: string, elem: HTMLElement): CommandExecutionResult {
        const key = name.toLowerCase();
        if (!(key in this.__commandHandlers))
            throw `Command "${name}" is not registered.`;

        const context: CommandContext = {
            target: elem,
            uiElem: this,
            transparent: false
        };

        const handler = this.__commandHandlers[key];

        if (handler.isExecuting)
            return { result: CommandsExecStatus.AlreadyExecuting, context };
        handler.isExecuting = true;

        if (!this._onCanExecCommand(name, elem)) {
            handler.isExecuting = false;
            return { result: CommandsExecStatus.NotAllow, context };
        }

        if (handler.canExecute && !handler.canExecute(elem, context)) {
            handler.isExecuting = false;
            return { result: CommandsExecStatus.NotAllow, context };
        }

        this.raiseEvent<CommandEventArgs>("command", {
            name: handler.name,
            uiElem: this,
            elem: this.__element
        });

        if (handler.execute) {
            // Если команда синхронная.

            try {
                handler.execute(elem, context);
            }
            finally {
                handler.isExecuting = false;
            }
        }
        else {
            // Если команда асинхронная.

            elem.classList.add(CommandExecutingCssClassName);

            const asyncContext: CommandAsyncContext = {
                target: elem,
                uiElem: this,
                transparent: context.transparent,
                complate: null,
                timeout: 30000,
                timeoutCallback: null
            };

            const endFunc = () => {
                handler.isExecuting = false;
                elem.classList.remove(CommandExecutingCssClassName);
            };

            let timeoutId: number = null;

            asyncContext.complate = () => {
                clearTimeout(timeoutId);
                endFunc();
            };

            handler.delegate(asyncContext);

            if (handler.isExecuting) {
                timeoutId = window.setTimeout(() => {
                    if (asyncContext.timeoutCallback)
                        asyncContext.timeoutCallback();
                    endFunc();
                }, asyncContext.timeout);
            }

            context.transparent = asyncContext.transparent;
        }

        return { result: CommandsExecStatus.Success, context: context };
    }

    protected _onRenderElement(_elem: HTMLElement) {
        return;
    }
    protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean {
        return true;
    }

    destroy() {
        if (this.__element) {
            //this.__element.removeAttribute(ElemAttributeName);
            delete this.__element.dataset[ElemAttributeName];
            delete this.__element[ElemPropertyName];

            this.__element = null;
        }
    }
}

export interface EventOptions {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
}

export interface CommandEventArgs {
    name: string;
    uiElem: UIElement;
    elem: HTMLElement;
}

export interface CommandContext {
    /** Елемент, который принял команду. */
    target: HTMLElement;
    uiElem: UIElement;
    transparent?: boolean;
}

export interface CommandExecutionResult {
    result: CommandsExecStatus;
    context: CommandContext;
}

export interface CommandAsyncContext extends CommandContext {
    complate: () => void;
    timeout: number;
    timeoutCallback: () => void;
}

export enum CommandsExecStatus {
    NotAllow = 1,
    AlreadyExecuting = 2,
    Success = 3
}

const fundUiElementByCommand = (elem: HTMLElement, commandName: string): UIElement => {
    while (elem) {
        if (elem.dataset[ElemAttributeName]) {
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
        if (commandElem.dataset[CommandAttributeName])
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

    const commandName = commandElem.dataset[CommandAttributeName];

    const uiElem = fundUiElementByCommand(commandElem, commandName);
    if (uiElem === null) {
        console.warn(`Not find handler for command "${commandName}".`);
    }
    else {
        const commandResult = uiElem.execCommand(commandName, commandElem);
        if (commandResult.context.transparent)
            return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    return false;
}

window.addEventListener("click", commandClickHandler, false);

(function () {
    const name = "CustomEvent";
    if (typeof window[name] === "function") return false; //If not IE

    const customEvent = function (event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        const evt = document.createEvent(name);
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    };

    customEvent.prototype = window["Event"].prototype;

    (window as object)[name] = customEvent;
})();