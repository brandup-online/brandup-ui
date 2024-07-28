import { UIElement, CommandEventArgs } from "./element";

declare global {
	interface HTMLElement {
		ui(factory: (elem: HTMLElement) => UIElement): HTMLElement;
	}

	interface Node {
		readonly uielement: UIElement | undefined;
	}

	interface HTMLElementEventMap {
		"uicommand": CustomEvent<CommandEventArgs>;
	}
}

HTMLElement.prototype.ui = function (factory: (elem: HTMLElement) => UIElement): HTMLElement {
	factory(this);
	return this;
};