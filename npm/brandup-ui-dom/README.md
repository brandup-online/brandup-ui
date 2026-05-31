# brandup-ui-dom

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui-dom](https://www.npmjs.com/package/@brandup/ui-dom).

```
npm i @brandup/ui-dom@latest
```

## DOM helper

Methods for working with the DOM with ease. All functions are available through the `DOM` object.

```ts
import { DOM } from "@brandup/ui-dom";
```

```ts
const DOM = {
    // Finding elements
    getById<T extends HTMLElement = HTMLElement>(id: string): T | null;
    getByClass<T extends HTMLElement = HTMLElement>(container: Element, className: string): T | null;
    getByName<T extends HTMLElement = HTMLElement>(name: string): T | null;
    getElementByTagName<T extends HTMLElement = HTMLElement>(container: Element, tagName: string): T | null;
    getElementsByTagName(container: Element, tagName: string): HTMLCollectionOf<Element>;
    queryElement<T extends HTMLElement = HTMLElement>(container: Element, query: string): T | null;
    queryElements<T extends HTMLElement = HTMLElement>(container: Element, query: string): NodeListOf<T>;

    // Navigating sibling elements
    nextElement<T extends HTMLElement = HTMLElement>(current: Element): T | null;
    prevElement<T extends HTMLElement = HTMLElement>(current: Element): T | null;
    nextElementByClass<T extends HTMLElement = HTMLElement>(current: Element, className: string): T | null;
    prevElementByClass<T extends HTMLElement = HTMLElement>(current: Element, className: string): T | null;

    // CSS classes
    addClass(container: Element | null | undefined, selectors: string, cssClass: CssClass): void;
    removeClass(container: Element | null | undefined, selectors: string, cssClass: CssClass): void;

    // Clearing
    empty(container: Element | null | undefined): void;

    // Creating elements
    tag<T extends keyof HTMLElementTagNameMap>(tagName: T, options?: ElementOptions | CssClass | null, ...children: TagChildrenLike[]): HTMLElementTagNameMap[T];
};
```

### Creation HTML elements

`DOM.tag` creates an element from a tag name. The second argument is either a CSS class string/array (`CssClass`) or an `ElementOptions` object. The remaining arguments are children (`TagChildrenLike`).

```ts
// Class as a string or an array
DOM.tag("div", "css-class-name");
DOM.tag("div", ["class-a", "class-b"]);

// Children: a string is inserted as HTML, a number as text, an element as-is
DOM.tag("div", "css-class-name", "<p>test</p>");
DOM.tag("div", "css-class-name", DOM.tag("p", null, "test"));

// Multiple children, including nested arrays
DOM.tag("ul", null, [
    DOM.tag("li", null, "1"),
    DOM.tag("li", null, "2")
]);

// A function child receives the element being created and can return a new child
DOM.tag("div", null, (elem) => DOM.tag("span", null, "child"));

// A Promise child (or a function returning a Promise) is appended once it resolves
DOM.tag("div", null, fetch("/fragment").then(r => r.text()));
```

The full `ElementOptions` object:

```ts
interface ElementOptions {
    id?: string;                  // id attribute
    class?: CssClass;             // CSS class(es): a string or an array of strings
    command?: string;             // data-command
    dataset?: ElementData;        // arbitrary data-* attributes
    events?: ElementEvents;       // event handlers keyed by lowercase name
    styles?: ElementStyles;       // inline styles (Partial<CSSStyleDeclaration>)
    [name: string]:               // any other key is a plain attribute:
        | string | number | boolean | object | null | undefined;
    // null → empty attribute, object → JSON.stringify, undefined → ignored
}
```

An example using the full set of options:

```ts
DOM.tag("button", {
    id: "submit",
    class: ["btn", "btn-primary"],
    command: "submit",
    dataset: { role: "action" },     // data-role="action"
    styles: { color: "red" },
    events: { click: (e) => console.log(e) },
    type: "button",                  // arbitrary attribute
    disabled: null                   // empty disabled attribute
}, "Send");
```

### Types

```ts
type CssClass = string | string[];
interface ElementData { [name: string]: string | undefined; }
type ElementEvents = { [Name in keyof HTMLElementEventMap as Lowercase<...>]?: (e) => void };
type ElementStyles = Partial<CSSStyleDeclaration>;
type TagChildrenPrimitive = Element | string | number | null | undefined;
type TagChildrenLike =
    | TagChildrenPrimitive
    | Promise<TagChildrenPrimitive>
    | ((elem: HTMLElement) => TagChildrenPrimitive | TagChildrenPrimitive[] | Promise<...> | void)
    | Array<TagChildrenLike>;
```
