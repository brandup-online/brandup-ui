# brandup-ui-dom

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [brandup-ui-dom](https://www.npmjs.com/package/brandup-ui-dom).

```
npm i brandup-ui-dom@latest
```

## DOM helper

Методы для простой работы с DOM моделью.

```
class DOM {
    static getElementById(id: string): HTMLElement | null;
    static getElementByClass(parentElement: Element, className: string): HTMLElement | null;
    static getElementByName(name: string): HTMLElement | null;
    static getElementByTagName(parentElement: Element, tagName: string): HTMLElement | null;
    static getElementsByTagName(parentElement: Element, tagName: string);
    static queryElement(parentElement: Element, query: string): HTMLElement | null;
    static queryElements(parentElement: Element, query: string): NodeListOf<HTMLElement>;
    static nextElementByClass(currentElement: Element, className: string): HTMLElement | null;
    static prevElementByClass(currentElement: Element, className: string): HTMLElement | null;
    static prevElement(currentElement: Element): HTMLElement | null;
    static nextElement(currentElement: Element): HTMLElement | null;

    static tag(tagName: string, options?: ElementOptions | string, children?: ((elem: Element) => void) | Element | string | Array<Element | string | ((parent: Element) => Element)>): HTMLElement

    static addClass(container: Element, selectors: string, className: string)
    static removeClass(container: Element, selectors: string, className: string);

    static empty(element: Element);
}
```

### Creation HTML elements

```
DOM.tag("div", "css class name")
DOM.tag("div", "css class name", "<p>test</p>")
DOM.tag("div", "css class name", DOM.tag("p", null, "test"))
DOM.tag("div", {
    id?: string,
    dataset?: ElementData;
    styles?: ElementStyles;
    class?: string | Array<string>;
    events?: { [name: string]: EventListenerOrEventListenerObject };
    command?: string;
    [name: string]: string | number | boolean | object;
})
```