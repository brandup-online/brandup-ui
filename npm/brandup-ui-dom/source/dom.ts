import { CssClass } from "./types";
import helpers from "./helpers";

/**
 * Finds an element by its `id` within the whole document.
 * @param id The element id to look up.
 * @returns The matching element, or `null` if none exists.
 */
function getById<TElement extends HTMLElement = HTMLElement>(id: string): TElement | null {
	return document.getElementById(id) as TElement;
}

/**
 * Returns the first descendant of `container` that has the given class.
 * @param container Element to search within.
 * @param className Single class name to match.
 * @returns The first matching element, or `null` if none found.
 */
function getByClass<TElement extends HTMLElement = HTMLElement>(container: Element, className: string): TElement | null {
	const elements = container.getElementsByClassName(className);
	if (elements.length === 0)
		return null;
	return elements.item(0) as TElement;
}

/**
 * Returns the first element in the document with the given `name` attribute.
 * @param name The `name` attribute value to look up.
 * @returns The first matching element, or `null` if none found.
 */
function getByName<TElement extends HTMLElement = HTMLElement>(name: string): TElement | null {
	const elements = document.getElementsByName(name);
	if (elements.length === 0)
		return null;
	return elements.item(0) as TElement;
}

/**
 * Returns the first descendant of `container` with the given tag name.
 * @param container Element to search within.
 * @param tagName Tag name to match (e.g. `"input"`).
 * @returns The first matching element, or `null` if none found.
 */
function getElementByTagName<TElement extends HTMLElement = HTMLElement>(container: Element, tagName: string): TElement | null {
	const elements = container.getElementsByTagName(tagName);
	if (elements.length === 0)
		return null;
	return elements.item(0) as TElement;
}

/**
 * Returns all descendants of `container` with the given tag name as a live collection.
 * @param container Element to search within.
 * @param tagName Tag name to match (e.g. `"li"`).
 * @returns A live `HTMLCollection` of matching elements.
 */
function getElementsByTagName(container: Element, tagName: string) {
	return container.getElementsByTagName(tagName);
}

/**
 * Returns the first descendant of `container` matching the CSS selector.
 * @param container Element to search within.
 * @param query CSS selector.
 * @returns The first matching element, or `null` if none found.
 */
function queryElement<TElement extends HTMLElement = HTMLElement>(container: Element, query: string): TElement | null {
	return container.querySelector(query);
}

/**
 * Returns all descendants of `container` matching the CSS selector.
 * @param container Element to search within.
 * @param query CSS selector.
 * @returns A static `NodeList` of matching elements.
 */
function queryElements<TElement extends HTMLElement = HTMLElement>(container: Element, query: string): NodeListOf<TElement> {
	return container.querySelectorAll(query) as NodeListOf<TElement>;
}

/**
 * Walks forward through the following siblings of `current` and returns the first one that has the given class.
 * @param current Element to start from.
 * @param className Class name to match.
 * @returns The first matching following sibling, or `null` if none found.
 */
function nextElementByClass<TElement extends HTMLElement = HTMLElement>(current: Element, className: string): TElement | null {
	let elem = current.nextSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement && elem.classList.contains(className))
			return elem as TElement;

		elem = elem.nextSibling;
	}
	return null;
}

/**
 * Walks backward through the preceding siblings of `current` and returns the first one that has the given class.
 * @param current Element to start from.
 * @param className Class name to match.
 * @returns The first matching preceding sibling, or `null` if none found.
 */
function prevElementByClass<TElement extends HTMLElement = HTMLElement>(current: Element, className: string): TElement | null {
	let elem = current.previousSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement && elem.classList.contains(className))
			return elem as TElement;

		elem = elem.previousSibling;
	}
	return null;
}

/**
 * Returns the nearest preceding sibling element of `current`, skipping non-element nodes (e.g. text nodes).
 * @param current Element to start from.
 * @returns The previous sibling element, or `null` if none found.
 */
function prevElement<TElement extends HTMLElement = HTMLElement>(current: Element): TElement | null {
	let elem = current.previousSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement)
			return elem as TElement;

		elem = elem.previousSibling;
	}
	return null;
}

/**
 * Returns the nearest following sibling element of `current`, skipping non-element nodes (e.g. text nodes).
 * @param current Element to start from.
 * @returns The next sibling element, or `null` if none found.
 */
function nextElement<TElement extends HTMLElement = HTMLElement>(current: Element): TElement | null {
	let elem = current.nextSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement)
			return elem as TElement;

		elem = elem.nextSibling;
	}
	return null;
}

/**
 * Adds the given CSS class(es) to every descendant of `container` matching the selector. No-op when `container` or `cssClass` is falsy.
 * @param container Element to search within (ignored when null/undefined).
 * @param selectors CSS selector for the elements to modify.
 * @param cssClass Class name(s) to add.
 */
function addClass(container: Element | null | undefined, selectors: string, cssClass: CssClass) {
	if (!container || !cssClass)
		return;

	const nodes = container.querySelectorAll(selectors);
	nodes.forEach(node => helpers.addCssClass(node, cssClass));
}

/**
 * Removes the given CSS class(es) from every descendant of `container` matching the selector. No-op when `container` or `cssClass` is falsy.
 * @param container Element to search within (ignored when null/undefined).
 * @param selectors CSS selector for the elements to modify.
 * @param cssClass Class name(s) to remove.
 */
function removeClass(container: Element | null | undefined, selectors: string, cssClass: CssClass) {
	if (!container || !cssClass)
		return;

	const nodes = container.querySelectorAll(selectors);
	nodes.forEach(elem => helpers.removeCssClass(elem, cssClass));
}

/**
 * Removes all child nodes from `container`, leaving it empty. No-op when `container` is null/undefined.
 * @param container Element to clear.
 */
function empty(container: Element | null | undefined) {
	if (!container)
		return;

	while (container.hasChildNodes()) {
		if (container.firstChild)
			container.removeChild(container.firstChild);
	}
}

export {
	getById,
	getByClass,
	getByName,
	getElementByTagName,
	getElementsByTagName,
	queryElement,
	queryElements,
	nextElementByClass,
	prevElementByClass,
	prevElement,
	nextElement,
	addClass,
	removeClass,
	empty
}