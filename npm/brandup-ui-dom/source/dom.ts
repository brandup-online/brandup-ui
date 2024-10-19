import { CssClass } from "./types";
import helpers from "./helpers";

function getById<TElement extends HTMLElement = HTMLElement>(id: string): TElement | null {
	return document.getElementById(id) as TElement;
}

function getByClass<TElement extends HTMLElement = HTMLElement>(container: Element, className: string): TElement | null {
	const elements = container.getElementsByClassName(className);
	if (elements.length === 0)
		return null;
	return elements.item(0) as TElement;
}

function getByName<TElement extends HTMLElement = HTMLElement>(name: string): TElement | null {
	const elements = document.getElementsByName(name);
	if (elements.length === 0)
		return null;
	return elements.item(0) as TElement;
}

function getElementByTagName<TElement extends HTMLElement = HTMLElement>(container: Element, tagName: string): TElement | null {
	const elements = container.getElementsByTagName(tagName);
	if (elements.length === 0)
		return null;
	return elements.item(0) as TElement;
}

function getElementsByTagName(container: Element, tagName: string) {
	return container.getElementsByTagName(tagName);
}

function queryElement<TElement extends HTMLElement = HTMLElement>(container: Element, query: string): TElement | null {
	return container.querySelector(query);
}

function queryElements<TElement extends HTMLElement = HTMLElement>(container: Element, query: string): NodeListOf<TElement> {
	return container.querySelectorAll(query) as NodeListOf<TElement>;
}

function nextElementByClass<TElement extends HTMLElement = HTMLElement>(current: Element, className: string): TElement | null {
	let elem = current.nextSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement && elem.classList.contains(className))
			return elem as TElement;

		elem = elem.nextSibling;
	}
	return null;
}

function prevElementByClass<TElement extends HTMLElement = HTMLElement>(current: Element, className: string): TElement | null {
	let elem = current.previousSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement && elem.classList.contains(className))
			return elem as TElement;

		elem = elem.previousSibling;
	}
	return null;
}

function prevElement<TElement extends HTMLElement = HTMLElement>(current: Element): TElement | null {
	let elem = current.previousSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement)
			return elem as TElement;

		elem = elem.previousSibling;
	}
	return null;
}

function nextElement<TElement extends HTMLElement = HTMLElement>(current: Element): TElement | null {
	let elem = current.nextSibling;
	while (elem) {
		if (elem.nodeType === Node.ELEMENT_NODE && elem instanceof HTMLElement)
			return elem as TElement;

		elem = elem.nextSibling;
	}
	return null;
}

function addClass(container: Element | null | undefined, selectors: string, cssClass: CssClass) {
	if (!container || !cssClass)
		return;

	const nodes = container.querySelectorAll(selectors);
	nodes.forEach(node => helpers.addCssClass(node, cssClass));
}

function removeClass(container: Element | null | undefined, selectors: string, cssClass: CssClass) {
	if (!container || !cssClass)
		return;

	const nodes = container.querySelectorAll(selectors);
	nodes.forEach(elem => helpers.removeCssClass(elem, cssClass));
}

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