/** Names of the DOM attributes, properties and CSS classes used by the library. */
export interface UiConstants {
	/** `data-*` attribute name storing the `UIElement.typeName` on its element. */
	readonly ElemAttributeName: string;
	/** Property name on the DOM element referencing its bound `UIElement` instance. */
	readonly ElemPropertyName: string;
	/** `data-*` attribute name declaring a command name in markup. */
	readonly CommandAttributeName: string;
	/** CSS class added to the target element while an async command is executing. */
	readonly CommandExecutingCssClassName: string;
};

/** Default constant values used across the library. */
const constants: UiConstants = {
	ElemAttributeName: "uiElement",
	ElemPropertyName: "uielement",
	CommandAttributeName: "command",
	CommandExecutingCssClassName: "executing"
};

export default constants;