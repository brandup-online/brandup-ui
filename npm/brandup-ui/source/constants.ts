export interface UiConstants {
	readonly ElemAttributeName: string;
	readonly ElemPropertyName: string;
	readonly CommandAttributeName: string;
	readonly CommandExecutingCssClassName: string;
	readonly CommandEventName: string;
};

const constants: UiConstants = {
	ElemAttributeName: "uiElement",
	ElemPropertyName: "uielement",
	CommandAttributeName: "command",
	CommandExecutingCssClassName: "executing",
	CommandEventName: "uicommand"
};

export default constants;