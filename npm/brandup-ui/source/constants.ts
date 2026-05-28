export interface UiConstants {
	readonly ElemAttributeName: string;
	readonly ElemPropertyName: string;
	readonly CommandAttributeName: string;
	readonly CommandExecutingCssClassName: string;
};

const constants: UiConstants = {
	ElemAttributeName: "uiElement",
	ElemPropertyName: "uielement",
	CommandAttributeName: "command",
	CommandExecutingCssClassName: "executing"
};

export default constants;