import { EventEmitter } from "./events";
import UICONSTANTS from "./constants";

export abstract class UIElement extends EventEmitter {
	private __element?: HTMLElement;
	private __events?: { [key: string]: EventInit | null };
	private __commands?: { [key: string]: CommandInit };
	private __destroyed?: boolean;

	abstract typeName: string;

	// Element members

	get element(): HTMLElement | undefined { return this.__element; }

	protected setElement(elem: HTMLElement) {
		if (!elem)
			throw new Error("Not set value elem.");

		if (this.__element || UIElement.hasElement(elem))
			throw new Error("UIElement already defined");

		this.__element = elem;

		(<any>elem)[UICONSTANTS.ElemPropertyName] = this;
		elem.dataset[UICONSTANTS.ElemAttributeName] = this.typeName;

		this._onRenderElement(elem);
	}

	// static members

	static hasElement(elem: HTMLElement) {
		return !!elem.dataset[UICONSTANTS.ElemAttributeName];
	}

	// Command members

	registerCommand(name: string, execute: CommandExecuteFunction, canExecute?: CommandCanExecuteFunction) {
		if (this.__destroyed)
			return this;

		const commands = this.__commands || (this.__commands = {});

		const nornalizedName = name.toLowerCase();
		if (nornalizedName in commands)
			throw new Error(`Command "${name}" already registered.`);

		commands[nornalizedName] = {
			name: name,
			execute,
			canExecute
		};

		return this;
	}

	hasCommand(name: string) {
		return !!this.__commands && name.toLowerCase() in this.__commands;
	}

	/** @internal */
	__execCommand(name: string, target: HTMLElement): CommandResult {
		if (this.__destroyed || !this.__element)
			throw new Error("UIElement is destroyed or has no element.");

		const key = name.toLowerCase();
		const command = this.__commands?.[key];
		if (!command)
			throw new Error(`Command "${name}" is not registered.`);

		const context: CommandContext = {
			target,
			uiElem: this
		};

		if (command.isExecuting)
			return { status: "already", context };
		command.isExecuting = true;

		// keep isExecuting cleanup inside finally so a throw in the
		// guards/trigger/execute can never leave the command stuck.
		let isAsync = false;
		try {
			if (!this._onCanExecCommand(name, target))
				return { status: "disallow", context };

			if (command.canExecute && !command.canExecute(context))
				return { status: "disallow", context };

			this.trigger("command", { element: this, name: command.name });

			const commandResult = command.execute(context);

			if (commandResult instanceof Promise) {
				isAsync = true;

				target.classList.add(UICONSTANTS.CommandExecutingCssClassName);
				commandResult
					.catch(() => { }) // command owns its errors; just avoid unhandled rejection
					.finally(() => {
						target.classList.remove(UICONSTANTS.CommandExecutingCssClassName);
						delete command.isExecuting;
					});
			}

			return { status: "success", context };
		}
		finally {
			if (!isAsync)
				delete command.isExecuting;
		}
	}

	protected _onRenderElement(_elem: HTMLElement) { }

	protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean {
		return true;
	}

	onDestroy(callback: VoidFunction | UIElement | Element) {
		if (this.__destroyed || !this.__element || !callback)
			return;

		if (callback instanceof UIElement)
			callback.listenTo(this, "destroy", () => callback.destroy());
		else if (callback instanceof Element)
			this.on("destroy", () => callback.remove());
		else if (typeof callback === "function")
			this.on("destroy", () => callback());
		else
			throw new Error("Unsupported callback type.");
	}

	override toString(): string { return this.typeName; }

	destroy() {
		if (this.__destroyed)
			return;
		this.__destroyed = true;

		this.trigger("destroy", this);
		super.stopEvents();

		const elem = this.__element;
		if (elem) {
			delete elem.dataset[UICONSTANTS.ElemAttributeName];
			delete (<any>elem)[UICONSTANTS.ElemPropertyName];
		}

		delete this.__element;
		delete this.__events;
		delete this.__commands;
	}
}

const findUiElementByCommand = (elem: HTMLElement, commandName: string): UIElement | null => {
	let current: HTMLElement | null = elem;
	while (current) {
		if (current.dataset[UICONSTANTS.ElemAttributeName]) {
			const uiElem: UIElement = (<any>current)[UICONSTANTS.ElemPropertyName];
			if (uiElem.hasCommand(commandName))
				return uiElem;
		}

		current = current.parentElement;
	}

	return null;
};

const commandClickHandler = (e: MouseEvent) => {
	let commandElem: HTMLElement | null = e.target as HTMLElement;
	while (commandElem) {
		if (commandElem.dataset[UICONSTANTS.CommandAttributeName])
			break;

		if (commandElem === e.currentTarget)
			return;

		commandElem = commandElem.parentElement;
	}

	if (!commandElem)
		return;

	const commandName = commandElem.dataset[UICONSTANTS.CommandAttributeName];
	if (!commandName)
		throw new Error("Command data attribute is not have value.");

	const uiElem = findUiElementByCommand(commandElem, commandName);
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

interface CommandInit {
	name: string;
	execute: CommandExecuteFunction;
	canExecute?: CommandCanExecuteFunction;
	isExecuting?: boolean;
}

export type CommandExecuteFunction = (context: CommandContext) => void | Promise<void | any>;
export type CommandCanExecuteFunction = (context: CommandContext) => boolean;

export interface CommandEventArgs {
	element: UIElement;
	name: string;
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