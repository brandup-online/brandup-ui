import { CssClass } from "./types";

/**
 * @internal
 * Adds one or more CSS classes to a single element. A string is split on spaces. No-op when `cssClass` is falsy.
 */
const addCssClass = (elem: Element, cssClass: CssClass) => {
	if (!cssClass)
		return;

	if (!Array.isArray(cssClass))
		cssClass = cssClass.split(' ');

	elem.classList.add(...cssClass);
};

/**
 * @internal
 * Removes one or more CSS classes from a single element. A string is split on spaces. No-op when `cssClass` is falsy.
 */
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