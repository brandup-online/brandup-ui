# brandup-ui-dom

Методы для простой работы с DOM моделью.

```
class DOM {
    static getElementById(id: string): HTMLElement;
    static getElementByClass(parentElement: Element, className: string): HTMLElement;
    static getElementByName(name: string): HTMLElement;
    static getElementByTagName(parentElement: Element, tagName: string): HTMLElement;
    static getElementsByTagName(parentElement: Element, tagName: string);
    static queryElement(parentElement: Element, query: string): HTMLElement;
    static queryElements(parentElement: Element, query: string): NodeListOf<HTMLElement>;
    static nextElementByClass(currentElement: Element, className: string): HTMLElement;
    static prevElementByClass(currentElement: Element, className: string): HTMLElement;
    static prevElement(currentElement: Element): HTMLElement;
    static nextElement(currentElement: Element): HTMLElement;

    static tag(tagName: string, options?: ElementOptions | string, children?: ((elem: Element) => void) | Element | string | Array<Element | string | ((parent: Element) => Element)>): HTMLElement

    static addClass(container: Element, selectors: string, className: string)
    static removeClass(container: Element, selectors: string, className: string);

    static empty(element: Element);
}
```

### Создание элементов

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