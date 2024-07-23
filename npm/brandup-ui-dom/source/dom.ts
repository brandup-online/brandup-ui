import { CssClass } from "./types";
import helpers from "./helpers";

function getById(id: string): HTMLElement | null {
	return document.getElementById(id);
}

function getByClass(container: Element, className: string): HTMLElement | null {
	const elements = container.getElementsByClassName(className);
	if (elements.length === 0)
		return null;
	return elements.item(0) as HTMLElement;
}

function getByName(name: string): HTMLElement | null {
	const elements = document.getElementsByName(name);
	if (elements.length === 0)
		return null;
	return elements.item(0) as HTMLElement;
}

function getElementByTagName(container: Element, tagName: string): HTMLElement | null {
	const elements = container.getElementsByTagName(tagName);
	if (elements.length === 0)
		return null;
	return elements.item(0) as HTMLElement;
}

function getElementsByTagName(container: Element, tagName: string) {
	return container.getElementsByTagName(tagName);
}

function queryElement(container: Element, query: string): HTMLElement | null {
	return container.querySelector(query);
}

function queryElements(container: Element, query: string): NodeListOf<HTMLElement> {
	return container.querySelectorAll(query);
}

function nextElementByClass(currentElement: Element, className: string): HTMLElement | null {
	let n = currentElement.nextSibling;
	while (n) {
		if (n.nodeType === 1) {
			if ((n as HTMLElement).classList.contains(className))
				return n as HTMLElement;
		}

		n = n.nextSibling;
	}
	return null;
}

function prevElementByClass(currentElement: Element, className: string): HTMLElement | null {
	let n = currentElement.previousSibling;
	while (n) {
		if (n.nodeType === 1) {
			if ((n as HTMLElement).classList.contains(className))
				return n as HTMLElement;
		}

		n = n.previousSibling;
	}
	return null;
}

function prevElement(currentElement: Element): HTMLElement | null {
	let n = currentElement.previousSibling;
	while (n) {
		if (n.nodeType === 1) {
			return n as HTMLElement;
		}

		n = n.previousSibling;
	}
	return null;
}

function nextElement(currentElement: Element): HTMLElement | null {
	let n = currentElement.nextSibling;
	while (n) {
		if (n.nodeType === 1) {
			return n as HTMLElement;
		}

		n = n.nextSibling;
	}
	return null;
}

function addClass(container: Element, selectors: string, cssClass: CssClass) {
	if (!cssClass)
		return;

	const nodes = container.querySelectorAll(selectors);
	nodes.forEach(node => helpers.addCssClass(node, cssClass));
}

function removeClass(container: Element, selectors: string, cssClass: CssClass) {
	if (!cssClass)
		return;

	const nodes = container.querySelectorAll(selectors);
	nodes.forEach(elem => helpers.removeCssClass(elem, cssClass));
}

function empty(container: Element) {
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