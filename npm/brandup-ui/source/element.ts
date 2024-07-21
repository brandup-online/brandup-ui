export const ElemAttributeName = "uiElement";
export const ElemPropertyName = "brandupUiElement";
export const CommandAttributeName = "command";
export const CommandExecutingCssClassName = "executing";

export type CommandDelegate = (context: CommandContext) => void | Promise<void | any>;
export type CommandCanExecuteDelegate = (context: CommandContext) => boolean;

export abstract class UIElement {
	private __element: HTMLElement | null = null;
	private __events: { [key: string]: EventOptions | null } = {};
	private __commandHandlers: { [key: string]: CommandHandler } = {};

	abstract typeName: string;

	// Element members

	get element(): HTMLElement | null { return this.__element; }

	protected setElement(elem: HTMLElement) {
		if (!elem)
			throw "Not set value elem.";

		if (this.__element || UIElement.hasElement(elem))
			throw "UIElement already defined";

		this.__element = elem;

		(<any>this.__element)[ElemPropertyName] = this;
		this.__element.dataset[ElemAttributeName] = this.typeName;

		this.defineEvent("command", { cancelable: false, bubbles: true });

		this._onRenderElement(elem);
	}

	// static members

	static hasElement(elem: HTMLElement) {
		return !!elem.dataset[ElemAttributeName];
	}

	// HTMLElement event members

	protected defineEvent(eventName: string, eventOptions?: EventOptions) {
		this.__events[eventName] = eventOptions ? eventOptions : null;
	}

	protected raiseEvent<T = {}>(eventName: string, eventArgs?: T): boolean {
		if (!(eventName in this.__events))
			throw new Error(`Not found event "${eventName}".`);

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
		eventInit.detail = eventArgs ? eventArgs : <T>{};

		const event = new CustomEvent<T>(eventName, eventInit);

		return this.dispatchEvent(event);
	}

	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
		this.__element?.addEventListener(type, listener, options);
	}

	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) {
		this.__element?.removeEventListener(type, listener, options);
	}

	dispatchEvent(event: Event): boolean {
		if (!this.__element)
			throw new Error("HTMLElement is not defined.");

		return this.__element.dispatchEvent(event);
	}

	// Command members

	registerCommand(name: string, execute: CommandDelegate, canExecute?: CommandCanExecuteDelegate) {
		name = this.verifyCommandName(name);

		this.__commandHandlers[name] = {
			name: name,
			execute,
			canExecute,
			isExecuting: false
		};
	}

	hasCommand(name: string) {
		return name.toLowerCase() in this.__commandHandlers;
	}

	execCommand(name: string, elem: HTMLElement): CommandExecutionResult {
		if (!this.__element)
			throw new Error("UIElement is not set HTMLElement.");

		const key = name.toLowerCase();
		const handler = this.__commandHandlers[key];
		if (!handler)
			throw new Error(`Command "${name}" is not registered.`);

		const context: CommandContext = {
			target: elem,
			uiElem: this,
			transparent: false
		};

		if (handler.isExecuting)
			return { status: "already", context };
		handler.isExecuting = true;

		if (!this._onCanExecCommand(name, elem)) {
			handler.isExecuting = false;
			return { status: "disallow", context };
		}

		if (handler.canExecute && !handler.canExecute(context)) {
			handler.isExecuting = false;
			return { status: "disallow", context };
		}

		this.raiseEvent<CommandEventArgs>("command", {
			name: handler.name,
			uiElem: this,
			elem: this.__element
		});

		let isAsync: boolean | undefined;
		try {
			const handlerResult = handler.execute(context);

			if (handlerResult && handlerResult instanceof Promise) {
				isAsync = true;

				elem.classList.add(CommandExecutingCssClassName);
				handlerResult
					.finally(() => {
						elem.classList.remove(CommandExecutingCssClassName);
						handler.isExecuting = false;
					});
			}
		}
		finally {
			if (!isAsync)
				handler.isExecuting = false;
		}

		return { status: "success", context: context };
	}

	private verifyCommandName(name: string) {
		const key = name.toLowerCase();
		if (key in this.__commandHandlers)
			throw new Error(`Command "${name}" already registered.`);
		return key;
	}

	protected _onRenderElement(_elem: HTMLElement) {
		return;
	}

	protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean {
		return true;
	}

	destroy() {
		const elem = this.__element;
		if (!elem)
			return;
		this.__element = null;

		delete elem.dataset[ElemAttributeName];
		delete (<any>elem)[ElemPropertyName];
	}
}

interface CommandHandler {
	name: string;
	isExecuting: boolean;
	execute: CommandDelegate;
	canExecute?: CommandCanExecuteDelegate;
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
	transparent: boolean;
}

export interface CommandExecutionResult {
	status: CommandExecStatus;
	context: CommandContext;
}

export interface CommandAsyncContext extends CommandContext {
	timeout?: number;
	complate: VoidFunction;
	timeoutCallback?: VoidFunction;
}

export type CommandExecStatus = "disallow" | "already" | "success";

const fundUiElementByCommand = (elem: HTMLElement, commandName: string): UIElement | null => {
	while (elem) {
		if (elem.dataset[ElemAttributeName]) {
			const uiElem: UIElement = (<any>elem)[ElemPropertyName];
			if (uiElem.hasCommand(commandName))
				return uiElem;
		}

		if (typeof elem.parentElement === "undefined")
			elem = elem.parentNode as HTMLElement;
		else if (elem.parentElement)
			elem = elem.parentElement;
		else
			break;
	}

	return null;
};

const commandClickHandler = (e: MouseEvent) => {
	let commandElem: HTMLElement | null = e.target as HTMLElement;
	while (commandElem) {
		if (commandElem.dataset[CommandAttributeName])
			break;

		if (commandElem === e.currentTarget)
			return;

		commandElem = commandElem.parentElement;
	}

	if (!commandElem)
		return;

	const commandName = commandElem.dataset[CommandAttributeName];
	if (!commandName)
		throw new Error("Command data attribute is not have value.");

	const uiElem = fundUiElementByCommand(commandElem, commandName);
	if (uiElem) {
		const result = uiElem.execCommand(commandName, commandElem);
		if (result.status == "success" && result.context.transparent)
			return;
	}
	else
		console.warn(`Not find handler for command "${commandName}".`);

	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
}

window.addEventListener("click", commandClickHandler, false);