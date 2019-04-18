export declare class DOM {
    static getElementByClass(parentElement: Element, className: string): HTMLElement;
    static getElementByName(name: string): HTMLElement;
    static getElementByTagName(parentElement: Element, tagName: string): HTMLElement;
    static getElementsByTagName(parentElement: Element, tagName: string): HTMLCollectionOf<Element>;
    static queryElement(parentElement: Element, query: string): HTMLElement;
    static queryElements(parentElement: Element, query: string): NodeListOf<HTMLElement>;
    static nextElementByClass(currentElement: Element, className: string): HTMLElement;
    static prevElementByClass(currentElement: Element, className: string): HTMLElement;
    static prevElement(currentElement: Element): HTMLElement;
    static create(tagName: string, classes?: Array<string> | string, attributes?: {
        [key: string]: string;
    }): HTMLElement;
    static tag(tagName: string, attributes?: {
        [key: string]: any;
    }, children?: ((elem: Element) => void) | Element | string | Array<Element | string | ((parent: Element) => Element)>): HTMLElement;
    static removeClass(container: Element, selectors: string, className: string): void;
    static empty(element: Element): void;
}
