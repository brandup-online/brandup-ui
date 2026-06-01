import { CssClass } from "./types";

/**
 * @internal
 * Adds one or more CSS classes to a single element. A string is split on spaces. No-op when `cssClass` is falsy.
 */
const addCssClass = (elem: Element, cssClass: CssClass) => {
	if (!cssClass)
		return;

	const tokens = (Array.isArray(cssClass) ? cssClass : cssClass.split(' ')).filter(Boolean);
	if (tokens.length)
		elem.classList.add(...tokens);
};

/**
 * @internal
 * Removes one or more CSS classes from a single element. A string is split on spaces. No-op when `cssClass` is falsy.
 */
const removeCssClass = (elem: Element, cssClass: CssClass) => {
	if (!cssClass)
		return;

	const tokens = (Array.isArray(cssClass) ? cssClass : cssClass.split(' ')).filter(Boolean);
	if (tokens.length)
		elem.classList.remove(...tokens);
};

export default {
	addCssClass,
	removeCssClass
}