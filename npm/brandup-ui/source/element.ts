import { EventEmitter } from "./events";
import UICONSTANTS from "./constants";

/** Built-in events triggered by every {@link UIElement}. */
export interface UIElementEvents {
	/** Triggered right before a command handler runs. */
	command: (args: CommandEventArgs) => void;
	/** Triggered when the element is destroyed. */
	destroy: (sender: UIElement<any>) => void;
}

/** Merge the built-in {@link UIElementEvents} with a subclass event map (built-in keys take precedence). */
type WithUIEvents<TEvents> = {
	[K in keyof UIElementEvents | keyof TEvents]:
		K extends keyof UIElementEvents ? UIElementEvents[K]
		: K extends keyof TEvents ? TEvents[K]
		: never;
};

/**
 * Wraps an `HTMLElement` and binds business logic, commands and events to it.
 *
 * The optional `TEvents` event map is merged with {@link UIElementEvents}, so subclasses
 * can declare their own typed events in addition to the built-in `command`/`destroy`.
 */
export abstract class UIElement<TEvents = {}> extends EventEmitter<WithUIEvents<TEvents>> {
	private __element?: HTMLElement;
	private __events?: { [key: string]: EventInit | null };
	private __commands?: { [key: string]: CommandInit };
	private __destroyed?: boolean;

	/** Unique type name of this UI element; also written to the element's data attribute. */
	abstract typeName: string;

	// Element members

	/** The bound DOM element, or `undefined` until `setElement` is called. */
	get element(): HTMLElement | undefined { return this.__element; }

	/**
	 * Bind a DOM element to this instance and run render logic. Can be called only once.
	 * @param elem Element to bind; throws if already bound or owned by another `UIElement`.
	 */
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

	/**
	 * Whether the given element is already bound to a `UIElement`.
	 * @param elem Element to test.
	 */
	static hasElement(elem: HTMLElement) {
		return !!elem.dataset[UICONSTANTS.ElemAttributeName];
	}

	// Command members

	/**
	 * Register a handler for a command declared in markup via the `data-command` attribute.
	 * @param name Command name (case-insensitive); throws if already registered.
	 * @param execute Handler run when the command fires; may return a `Promise` for async commands.
	 * @param canExecute Optional predicate gating whether the command may run.
	 * @returns This instance for chaining.
	 */
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

	/**
	 * Whether a command with the given name is registered.
	 * @param name Command name (case-insensitive).
	 */
	hasCommand(name: string) {
		return !!this.__commands && name.toLowerCase() in this.__commands;
	}

	/**
	 * Execute a registered command against a target element.
	 * @internal
	 */
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

			this.__raise("command", { element: this, name: command.name });

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

	/**
	 * Hook invoked when an element is bound via `setElement`. Override to render or wire up the element.
	 * @param _elem The newly bound element.
	 */
	/** Trigger a built-in event. Typed by {@link UIElementEvents}; bypasses the generic trigger overload internally. */
	private __raise<K extends keyof UIElementEvents>(name: K, ...args: Parameters<UIElementEvents[K]>): void {
		(this.trigger as unknown as (n: string, ...a: any[]) => void)(name, ...args);
	}

	protected _onRenderElement(_elem: HTMLElement) { }

	/**
	 * Hook deciding whether a command may execute. Override to add element-wide gating.
	 * @param _name Command name being executed.
	 * @param _elem Target element of the command.
	 * @returns `true` to allow execution (default), `false` to disallow.
	 */
	protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean {
		return true;
	}

	/**
	 * Register cleanup that runs when this element is destroyed.
	 * @param callback A function to call, another `UIElement` to destroy, or an `Element` to remove.
	 */
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

	/** Returns the `typeName` of this element. */
	override toString(): string { return this.typeName; }

	/** Destroy the element: trigger the `destroy` event, release events/commands and detach from the DOM element. */
	destroy() {
		if (this.__destroyed)
			return;
		this.__destroyed = true;

		this.__raise("destroy", this);
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

/** Command handler; returning a `Promise` marks the command as async (adds the `executing` CSS class while pending). */
export type CommandExecuteFunction = (context: CommandContext) => void | Promise<void | any>;
/** Predicate deciding whether a command may run for the given context. */
export type CommandCanExecuteFunction = (context: CommandContext) => boolean;

/** Arguments of the `command` event triggered before a command executes. */
export interface CommandEventArgs {
	/** UIElement that owns the command. */
	element: UIElement;
	/** Name of the command being executed. */
	name: string;
}

/** Context passed to command execute/canExecute handlers. */
export interface CommandContext {
	/** HTMLElement on which the command is executed */
	target: HTMLElement;
	/** UIElement in which the command handler is registered. */
	uiElem: UIElement;
	/** Don't stop the click event chain of target. */
	transparent?: boolean;
}

/** Outcome of an attempted command execution. */
export interface CommandResult {
	/** Execution status. */
	status: CommandExecStatus;
	/** Context the command ran with. */
	context: CommandContext;
}

/** Command execution status: `disallow` (gated out), `already` (re-entrant call ignored) or `success`. */
export type CommandExecStatus = "disallow" | "already" | "success";