import * as common from "./common"

export class DOM {
    static getElementByClass(parentElement: Element, className: string): HTMLElement {
        var elements = parentElement.getElementsByClassName(className);
        if (elements.length == 0)
            return null;
        return <HTMLElement>elements.item(0);
    }
    static getElementByName(name: string): HTMLElement {
        var elements = document.getElementsByName(name);
        if (elements.length == 0)
            return null;
        return <HTMLElement>elements.item(0);
    }
    static getElementByTagName(parentElement: Element, tagName: string): HTMLElement {
        var elements = parentElement.getElementsByTagName(tagName);
        if (elements.length == 0)
            return null;
        return <HTMLElement>elements.item(0);
    }
    static getElementsByTagName(parentElement: Element, tagName: string) {
        return parentElement.getElementsByTagName(tagName);
    }
    static queryElement(parentElement: Element, query: string): HTMLElement {
        return <HTMLElement>parentElement.querySelector(query);
    }
    static queryElements(parentElement: Element, query: string): NodeListOf<HTMLElement> {
        return <NodeListOf<HTMLElement>>parentElement.querySelectorAll(query);
    }
    static nextElementByClass(currentElement: Element, className: string): HTMLElement {
        var n = currentElement.nextSibling;
        while (n) {
            if (n.nodeType === 1) {
                if ((<HTMLElement>n).classList.contains(className))
                    return <HTMLElement>n;
            }

            n = n.nextSibling;
        }
        return null;
    }
    static prevElementByClass(currentElement: Element, className: string): HTMLElement {
        var n = currentElement.previousSibling;
        while (n) {
            if (n.nodeType === 1) {
                if ((<HTMLElement>n).classList.contains(className))
                    return <HTMLElement>n;
            }

            n = n.previousSibling;
        }
        return null;
    }
    static prevElement(currentElement: Element): HTMLElement {
        var n = currentElement.previousSibling;
        while (n) {
            if (n.nodeType === 1) {
                return <HTMLElement>n;
            }

            n = n.previousSibling;
        }
        return null;
    }

    static create(tagName: string, classes?: Array<string> | string, attributes?: { [key: string]: string; }): HTMLElement {
        var elem = document.createElement(tagName);
        if (classes) {
            if (common.Utility.isArray(classes) && (<Array<string>>classes).length)
                (<Array<string>>classes).forEach((className: string) => { elem.classList.add(className); });
            else
                elem.className = <string>classes;
        }
        if (attributes) {
            for (var key in attributes) {
                elem.setAttribute(key, attributes[key]);
            }
        }
        return elem;
    }
    static tag(tagName: string, attributes?: { [key: string]: any; }, children?: ((elem: Element) => void) | Element | string | Array<Element | string | ((parent: Element) => Element)>): HTMLElement {
        var elem = document.createElement(tagName);

        if (attributes) {
            for (let key in attributes) {
                var value = attributes[key];

                if (key === "styles") {
                    for (let sKey in value) {
                        elem.style[sKey] = value[sKey];
                    }
                }
                else if (key === "class") {
                    elem.className = value;
                }
                else {
                    if (typeof value === "function") {
                        if (key.indexOf("on") === 0)
                            key = key.substr(2);
                        elem.addEventListener(key, (e: Event) => {
                            value(e, elem);
                        });
                    }
                    else {
                        elem.setAttribute(key, value !== null ? value : "");
                    }
                }
            }
        }

        if (children) {
            if (children instanceof Element) {
                elem.insertAdjacentElement("beforeend", children);
            }
            else if (children instanceof Array) {
                for (var i = 0; i < children.length; i++) {
                    var chd = children[i];
                    if (chd instanceof Element)
                        elem.insertAdjacentElement("beforeend", chd);
                    else if (typeof chd === "function") {
                        var chdElem = chd(elem);
                        if (chdElem)
                            elem.insertAdjacentElement("beforeend", chdElem);
                    }
                    else if (typeof chd === "string") {
                        elem.insertAdjacentHTML("beforeend", chd);
                    }
                }
            }
            else if (typeof children === "string") {
                elem.innerHTML = <string>children;
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
        var nodes = container.querySelectorAll(selectors);
        for (var i = 0; i < nodes.length; i++) {
            nodes.item(i).classList.remove(className);
        }
    }

    static empty(element: Element) {
        while (element.hasChildNodes()) {
            element.removeChild(element.firstChild);
        }
    }
}