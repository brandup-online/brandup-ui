import { ElementOptions, CssClass, TagChildrenLike, TagChildrenPrimitive, TagFirstChild, ElementEvents } from "./types";
import { UIElement } from "../element";
import { Binding } from "./bind";
import { BindingEach, appendBindingEach } from "./bind-each";
import { effect } from "../reactive";
import { autoDisposeBinding } from "./binding-cleanup";
import helpers from "./helpers";

/** Returns `true` when `value` should be treated as options (or absent options), `false` when it is the first child. */
const isOptionsArg = (value: unknown): value is ElementOptions | CssClass | null | undefined => {
	if (value === null || value === undefined) return true;
	if (typeof value === "string") return true;
	if (typeof value === "number" || typeof value === "boolean") return false;
	if (value instanceof Element || value instanceof UIElement || value instanceof Binding || value instanceof BindingEach || value instanceof Promise) return false;
	if (typeof value === "function") return false;
	if (Array.isArray(value)) return (value as unknown[]).every(v => typeof v === "string"); // string[] → CssClass
	return true; // plain object → ElementOptions
};

// Overload 1: first non-name arg is unambiguously a child → options omitted
function tag<T extends keyof HTMLElementTagNameMap>(tagName: T, firstChild: TagFirstChild, ...children: TagChildrenLike[]): HTMLElementTagNameMap[T];
// Overload 2: options explicitly provided (null, CssClass string/array, or ElementOptions object)
function tag<T extends keyof HTMLElementTagNameMap>(tagName: T, options: ElementOptions | CssClass | null, ...children: TagChildrenLike[]): HTMLElementTagNameMap[T];
// Overload 3: tag name only
function tag<T extends keyof HTMLElementTagNameMap>(tagName: T): HTMLElementTagNameMap[T];
/**
 * Creates an HTML element, optionally applying options and appending children.
 *
 * The second argument is **options** when it is `null`, a CSS class string/array, or a plain object ({@link ElementOptions}).
 * It is treated as the **first child** when it is a {@link TagFirstChild} value (Element, UIElement, Binding, BindingEach, Promise, function, number, or boolean) — allowing `tag("ul", bindEach(...))` without a leading `null`.
 * Strings remain ambiguous and are always treated as CSS class — pass `null` first if you need an HTML string as the first child.
 */
function tag<T extends keyof HTMLElementTagNameMap>(tagName: T, optionsOrChild?: ElementOptions | CssClass | TagFirstChild | null, ...rest: TagChildrenLike[]): HTMLElementTagNameMap[T] {
	const elem = document.createElement(tagName);

	if (isOptionsArg(optionsOrChild)) {
		applyOptions(elem, optionsOrChild as ElementOptions | CssClass | null);
		appendChild(elem, rest);
	} else {
		appendChild(elem, optionsOrChild !== undefined ? [optionsOrChild as TagChildrenLike, ...rest] : rest);
	}

	return elem as HTMLElementTagNameMap[T];
}

/**
 * Applies element options to an existing element. A string or array is treated as a {@link CssClass}; otherwise each {@link ElementOptions} key is applied (`id`, `styles`, `class`, `command`, `dataset`, `events`, or a plain attribute). `undefined` values are skipped.
 * @param elem Target element to mutate.
 * @param options Options object, {@link CssClass} shorthand, or `null`/`undefined` for none.
 */
const applyOptions = (elem: HTMLElement, options?: ElementOptions | CssClass | null) => {
	if (!options)
		return;

	if (typeof options === "string" || Array.isArray(options))
		helpers.addCssClass(elem, <CssClass>options);
	else {
		for (const key in options) {
			const value = options[key];
			if (value === undefined)
				continue;

			switch (key) {
				case "id":
					elem.id = value as string;
					break;
				case "styles": {
					if (value) {
						for (const sKey in value as object)
							(<any>elem.style)[sKey] = (<any>value)[sKey];
					}
					break;
				}
				case "class": {
					helpers.addCssClass(elem, <CssClass>value);
					break;
				}
				case "command": {
					elem.dataset["command"] = value as string;
					break;
				}
				case "dataset": {
					if (value) {
						for (const dataName in value as object)
							elem.dataset[dataName] = (<any>value)[dataName];
					}
					break;
				}
				case "events": {
					if (value) {
						for (const eventName in value as ElementEvents)
							elem.addEventListener(eventName, (<any>value)[eventName]);
					}
					break;
				}
				default: {
					if (value === null)
						elem.setAttribute(key, "");
					else if (typeof value === "object")
						elem.setAttribute(key, JSON.stringify(value));
					else
						elem.setAttribute(key, String(value));
					break;
				}
			}
		}
	}
}

/**
 * Appends one or more children to a container, recursively resolving arrays, promises and factory functions. Elements are appended as-is; a {@link UIElement} appends its bound element (or defers until `setElement` binds one); a reactive {@link Binding} renders and live-updates in place; strings/numbers/booleans are inserted as HTML; `null`/`undefined` are ignored.
 * @param container Element to append the children to.
 * @param children Child or children to append. See {@link TagChildrenLike}.
 * @throws Error When a child resolves to an unsupported type.
 */
const appendChild = (container: HTMLElement, children?: TagChildrenLike) => {
	if (children === null || children === undefined)
		return;

	if (children instanceof Array)
		children.forEach(child => appendChild(container, child));
	else if (children instanceof Element)
		container.append(children);
	else if (children instanceof UIElement) {
		if (children.element)
			container.append(children.element);
		else {
			// reserve the position now; replace the placeholder once setElement
			// binds the element (after _onRenderElement), keeping child order
			const placeholder = document.createComment("");
			container.append(placeholder);
			children.once("rendered", () => {
				if (children.element)
					placeholder.replaceWith(children.element);
			});
		}
	}
	else if (children instanceof Binding)
		appendBinding(container, children);
	else if (children instanceof BindingEach)
		appendBindingEach(container, children);
	else if (children instanceof Promise)
		children.then((child: TagChildrenPrimitive) => appendChild(container, child));
	else {
		const typeName = typeof children;
		let html: string;
		switch (typeName) {
			case "string":
				html = <string>children;
				break;
			case "number":
			case "boolean":
				html = children.toString();
				break;
			case "function":
				const child = (<(elem: HTMLElement) => TagChildrenPrimitive>children)(container);
				appendChild(container, child);
				return;
			default:
				throw new Error(`Not support child type of ${typeName}.`);
		}
		container.insertAdjacentHTML("beforeend", html);
	}
};

/**
 * Renders a reactive {@link Binding} child and keeps it up to date: a reactive
 * effect re-evaluates the binding and updates the DOM in place — reusing a text
 * node for text values and swapping the node when an element/UIElement is returned.
 */
const appendBinding = (container: HTMLElement, binding: Binding) => {
	let current: ChildNode = document.createTextNode("");
	let textNode: Text | null = current as Text;
	container.append(current);

	const eff = effect(() => {
		const value = binding.compute();

		if (value instanceof Element || value instanceof UIElement) {
			const next: ChildNode = (value instanceof UIElement ? value.element : value) ?? document.createComment("");
			current.replaceWith(next);
			current = next;
			textNode = null;
		}
		else {
			// null/undefined/false render as empty text
			const text = (value === null || value === undefined || value === false) ? "" : String(value);
			if (textNode && textNode === current) {
				textNode.textContent = text;
			}
			else {
				const next = document.createTextNode(text);
				current.replaceWith(next);
				current = next;
				textNode = next;
			}
		}
	});

	// stop the effect when the rendered node is removed from the document
	autoDisposeBinding(() => current, eff);
};

export {
	tag,
	applyOptions,
	appendChild
}