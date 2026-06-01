import { UIElement } from "./element";

declare global {
	interface HTMLElement {
		/**
		 * Bind a `UIElement` to this element via the given factory and return the element for chaining.
		 * @param factory Callback that creates the `UIElement` for this element.
		 */
		ui(factory: (elem: HTMLElement) => UIElement): HTMLElement;
	}

	interface Node {
		/** `UIElement` bound to this node, or `undefined` when none is bound. */
		readonly uielement: UIElement | undefined;
	}
}

let __inited = false;

/**
 * Install the `HTMLElement.prototype.ui(factory)` convenience binder. Opt-in (no longer a
 * side effect on import) so bundlers can tree-shake it away for consumers that don't use it.
 * Idempotent and a no-op in a non-DOM environment.
 */
export function enableElementExtensions(): void {
	if (__inited || typeof HTMLElement === "undefined")
		return;
	__inited = true;

	HTMLElement.prototype.ui = function (factory: (elem: HTMLElement) => UIElement): HTMLElement {
		factory(this);
		return this;
	};
}