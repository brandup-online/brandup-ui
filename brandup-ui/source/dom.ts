import { Utility } from "./utility";

export class DOM {
    static getElementByClass(parentElement: Element, className: string): HTMLElement {
        const elements = parentElement.getElementsByClassName(className);
        if (elements.length === 0)
            return null;
        return elements.item(0) as HTMLElement;
    }
    static getElementByName(name: string): HTMLElement {
        const elements = document.getElementsByName(name);
        if (elements.length === 0)
            return null;
        return elements.item(0) as HTMLElement;
    }
    static getElementByTagName(parentElement: Element, tagName: string): HTMLElement {
        const elements = parentElement.getElementsByTagName(tagName);
        if (elements.length === 0)
            return null;
        return elements.item(0) as HTMLElement;
    }
    static getElementsByTagName(parentElement: Element, tagName: string) {
        return parentElement.getElementsByTagName(tagName);
    }
    static queryElement(parentElement: Element, query: string): HTMLElement {
        return parentElement.querySelector(query);
    }
    static queryElements(parentElement: Element, query: string): NodeListOf<HTMLElement> {
        return parentElement.querySelectorAll(query);
    }
    static nextElementByClass(currentElement: Element, className: string): HTMLElement {
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
    static prevElementByClass(currentElement: Element, className: string): HTMLElement {
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
    static prevElement(currentElement: Element): HTMLElement {
        let n = currentElement.previousSibling;
        while (n) {
            if (n.nodeType === 1) {
                return n as HTMLElement;
            }

            n = n.previousSibling;
        }
        return null;
    }

    static create(tagName: string, classes?: Array<string> | string, attributes?: { [key: string]: string }): HTMLElement {
        const elem = document.createElement(tagName);
        if (classes) {
            if (Utility.isArray(classes) && (classes as Array<string>).length)
                (classes as Array<string>).forEach((className: string) => { elem.classList.add(className); });
            else
                elem.className = classes as string;
        }
        if (attributes) {
            for (const key in attributes) {
                elem.setAttribute(key, attributes[key]);
            }
        }
        return elem;
    }
    static tag(tagName: string, attributes?: { [key: string]: string | object | ((e: Event, elem: Element) => void) }, children?: ((elem: Element) => void) | Element | string | Array<Element | string | ((parent: Element) => Element)>): HTMLElement {
        const elem = document.createElement(tagName);

        if (attributes) {
            for (let key in attributes) {
                const value = attributes[key];

                if (key === "styles") {
                    for (const sKey in value as object) {
                        elem.style[sKey] = value[sKey];
                    }
                }
                else if (key === "class") {
                    elem.className = value as string;
                }
                else {
                    if (typeof value === "function") {
                        if (key.indexOf("on") === 0)
                            key = key.substr(2);

                        elem.addEventListener(key, (e: Event) => {
                            value(e, elem);
                        });
                    }
                    else if (typeof value === "object") {
                        elem.setAttribute(key, value !== null ? JSON.stringify(value) : "");
                    }
                    else {
                        elem.setAttribute(key, value !== null ? value as string : "");
                    }
                }
            }
        }

        if (children) {
            if (children instanceof Element) {
                elem.insertAdjacentElement("beforeend", children);
            }
            else if (children instanceof Array) {
                for (let i = 0; i < children.length; i++) {
                    const chd = children[i];
                    if (chd instanceof Element)
                        elem.insertAdjacentElement("beforeend", chd);
                    else if (typeof chd === "function") {
                        const chdElem = chd(elem);
                        if (chdElem)
                            elem.insertAdjacentElement("beforeend", chdElem);
                    }
                    else if (typeof chd === "string") {
                        elem.insertAdjacentHTML("beforeend", chd);
                    }
                }
            }
            else if (typeof children === "string") {
                elem.innerHTML = children;
            }
            else if (typeof children === "function") {
                children(elem);
            }
            else
                throw new Error();
        }

        return elem;
    }

    static removeClass(container: Element, selectors: string, className: string) {
        const nodes = container.querySelectorAll(selectors);
        for (let i = 0; i < nodes.length; i++) {
            nodes.item(i).classList.remove(className);
        }
    }

    static empty(element: Element) {
        while (element.hasChildNodes()) {
            element.removeChild(element.firstChild);
        }
    }
}