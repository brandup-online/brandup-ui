export const ElemAttributeName = "uiElement";
export const ElemPropertyName = "brandupUiElement";
export const CommandAttributeName = "command";
export const CommandExecutingCssClassName = "executing";

export type CommandExecuteFunction = (context: CommandContext) => void | Promise<void | any>;
export type CommandCanExecuteFunction = (context: CommandContext) => boolean;

export abstract class UIElement {
	private __element?: HTMLElement;
	private __events?: { [key: string]: EventOptions | null };
	private __commands?: { [key: string]: CommandDefinition };

	abstract typeName: string;

	// Element members

	get element(): HTMLElement | undefined { return this.__element; }

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
		if (!this.__events)
			this.__events = {};
		this.__events[eventName] = eventOptions ? eventOptions : null;
	}

	protected raiseEvent<T = {}>(eventName: string, eventArgs?: T): boolean {
		if (!this.__events || !(eventName in this.__events))
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

	registerCommand(name: string, execute: CommandExecuteFunction, canExecute?: CommandCanExecuteFunction) {
		if (!this.__commands)
			this.__commands = {};

		const nornalizedName = name.toLowerCase();
		if (nornalizedName in this.__commands)
			throw new Error(`Command "${name}" already registered.`);

		this.__commands[nornalizedName] = {
			name: name,
			execute,
			canExecute
		};
	}

	hasCommand(name: string) {
		return this.__commands && name.toLowerCase() in this.__commands;
	}

	/** @internal */
	__execCommand(name: string, target: HTMLElement): CommandResult {
		if (!this.__element || !this.__commands)
			throw new Error("UIElement is not set HTMLElement.");

		const key = name.toLowerCase();
		const command = this.__commands[key];
		if (!command)
			throw new Error(`Command "${name}" is not registered.`);

		const context: CommandContext = {
			target,
			uiElem: this
		};

		if (command.isExecuting)
			return { status: "already", context };
		command.isExecuting = true;

		if (!this._onCanExecCommand(name, target)) {
			delete command.isExecuting;
			return { status: "disallow", context };
		}

		if (command.canExecute && !command.canExecute(context)) {
			delete command.isExecuting;
			return { status: "disallow", context };
		}

		this.raiseEvent<CommandEventArgs>("command", {
			name: command.name,
			uiElem: this,
			elem: this.__element
		});

		let isAsync: boolean | undefined;
		try {
			const commandResult = command.execute(context);

			if (commandResult && commandResult instanceof Promise) {
				isAsync = true;

				target.classList.add(CommandExecutingCssClassName);
				commandResult
					.finally(() => {
						target.classList.remove(CommandExecutingCssClassName);
						delete command.isExecuting;
					});
			}
		}
		finally {
			if (!isAsync)
				delete command.isExecuting;
		}

		return { status: "success", context: context };
	}

	protected _onRenderElement(_elem: HTMLElement) { }

	protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean {
		return true;
	}

	destroy() {
		const elem = this.__element;
		if (!elem)
			return;
		delete this.__element;
		delete this.__events;
		delete this.__commands;

		delete elem.dataset[ElemAttributeName];
		delete (<any>elem)[ElemPropertyName];
	}
}

interface CommandDefinition {
	name: string;
	execute: CommandExecuteFunction;
	canExecute?: CommandCanExecuteFunction;
	isExecuting?: boolean;
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
	/** HTMLElement on which the command is executed */
	target: HTMLElement;
	/** UIElement in which the command handler is registered. */
	uiElem: UIElement;
	/** Don't stop the click event chain of target. */
	transparent?: boolean;
}

export interface CommandResult {
	status: CommandExecStatus;
	context: CommandContext;
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
		const result = uiElem.__execCommand(commandName, commandElem);
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