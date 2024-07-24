import { CssClass } from "./types";

const addCssClass = (elem: Element, cssClass: CssClass) => {
	if (!cssClass)
		return;

	if (!Array.isArray(cssClass))
		cssClass = cssClass.split(' ');

	elem.classList.add(...cssClass);
};

const removeCssClass = (elem: Element, cssClass: CssClass) => {
	if (!cssClass)
		return;

	if (!Array.isArray(cssClass))
		cssClass = cssClass.split(' ');

	elem.classList.remove(...cssClass);
};

export default {
	addCssClass,
	removeCssClass
}