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

// Guarded so importing the module does not throw in a non-DOM environment (SSR/Node).
if (typeof HTMLElement !== "undefined") {
	HTMLElement.prototype.ui = function (factory: (elem: HTMLElement) => UIElement): HTMLElement {
		factory(this);
		return this;
	};
}

export { };