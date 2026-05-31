# brandup-ui

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui](https://www.npmjs.com/package/@brandup/ui).

```
npm i @brandup/ui@latest
```

## UIElement

`UIElement` is a wrapper for `HTMLElement` that lets you attach your own business logic to it.

Features:
- Handling of commands declared in the markup of the `HTMLElement` that is bound to the `UIElement`.
- Subscribing to events through `EventEmitter`, which `UIElement` extends.

```ts
abstract class UIElement extends EventEmitter {
    abstract typeName: string;
    readonly element: HTMLElement | undefined;

    static hasElement(elem: HTMLElement): boolean;

    protected setElement(elem: HTMLElement): void;

    registerCommand(name: string, execute: CommandExecuteFunction, canExecute?: CommandCanExecuteFunction): this;
    hasCommand(name: string): boolean;

    protected _onRenderElement(elem: HTMLElement): void;
    protected _onCanExecCommand(name: string, elem: HTMLElement): boolean;

    onDestroy(callback: VoidFunction | UIElement | Element): void;
    destroy(): void;

    toString(): string;
}
```

`UIElement` is an abstract class. A subclass sets `typeName` and binds a DOM element via `setElement`. An element can be bound only once; binding again (or binding an element that already belongs to another instance) throws an exception.

```ts
import { UIElement } from "@brandup/ui";

class MyWidget extends UIElement {
    typeName = "MyWidget";

    constructor(elem: HTMLElement) {
        super();
        this.setElement(elem);
    }

    protected _onRenderElement(elem: HTMLElement) {
        // initialize the markup
    }
}
```

The `HTMLElement.prototype.ui` extension lets you bind a `UIElement` through a factory and returns the element itself:

```ts
document.getElementById("widget")!.ui(elem => new MyWidget(elem));
```

The bound `UIElement` is available on the node through the `node.uielement` property.

### Element bound at construction

On the base `UIElement`, `element` is `HTMLElement | undefined` because the element may be bound later (an `Application`, for example, binds its element on run). When a component always receives its element in the constructor, extend `UIElementBound` instead — it binds the element immediately, so `element` is typed `HTMLElement` (never `undefined`):

```ts
import { UIElementBound } from "@brandup/ui";

class MyWidget extends UIElementBound {
    constructor(elem: HTMLElement) {
        super("MyWidget", elem); // typeName + element
    }
}

const w = new MyWidget(document.createElement("div"));
w.element.focus(); // element: HTMLElement — no ?./!
```

## UI commands

`UIElement` lets you register command handlers, which are declared in the markup through the `data-command` attribute.

```html
<button data-command="send">Send</button>
```

```ts
this.registerCommand("send", (context: CommandContext) => {
    context.target.innerHTML = "ok";
});
```

You can register asynchronous command handlers — just return a `Promise`:

```ts
this.registerCommand("command1-async", (context: CommandContext) => {
    return new Promise<void>(resolve => {
        context.target.innerHTML = "Loading...";
        window.setTimeout(() => {
            context.target.innerHTML = "Ok";
            resolve();
        }, 2000);
    });
});
```

The third argument, `canExecute`, lets you restrict execution of the command:

```ts
this.registerCommand(
    "submit",
    (context) => { /* ... */ },
    (context) => context.target.dataset.enabled === "true"
);
```

Commands are triggered by the `click` event. The handler is looked up by walking up the DOM from the element with the `data-command` attribute to the nearest `UIElement` in which that command is registered.

While an asynchronous command is running, the **executing** CSS class is added to the target element (and removed once the `Promise` settles).

Command type signatures:

```ts
type CommandExecuteFunction = (context: CommandContext) => void | Promise<void | any>;
type CommandCanExecuteFunction = (context: CommandContext) => boolean;

interface CommandContext {
    /** HTMLElement on which the command is executed. */
    target: HTMLElement;
    /** UIElement in which the command handler is registered. */
    uiElem: UIElement;
    /** Don't stop the click event chain of target. */
    transparent?: boolean;
}

interface CommandResult {
    status: CommandExecStatus; // "disallow" | "already" | "success"
    context: CommandContext;
}
```

Before executing a command, `UIElement` triggers the `command` event with `CommandEventArgs` arguments (`{ element, name }`).

## UI Events

`UIElement` extends the `EventEmitter` class.

```ts
class EventEmitter<TEvents = EventMap> {
    on<K extends keyof TEvents & string>(eventName: K, callback: TEvents[K], context?: any): this;
    once<K extends keyof TEvents & string>(eventName: K, callback: TEvents[K], context?: any): this;
    off<K extends keyof TEvents & string>(eventName?: K | "all" | null, callback?: TEvents[K] | EventCallbackFunc | null, context?: any | null): this;

    protected listenTo(source: EventEmitter<any>, eventName: string, callback: EventCallbackFunc): this;
    protected listenToOnce(source: EventEmitter<any>, eventName: string, callback: EventCallbackFunc): this;
    protected stopListening(source?: EventEmitter<any>, eventName?: string, callback?: EventCallbackFunc): this;

    protected trigger<K extends keyof TEvents & string>(eventName: K, ...args: Parameters<TEvents[K]>): this;
}
```

### Typed events

The optional `TEvents` type parameter is an **event map** (`{ eventName: (args) => void }`) that gives a subclass strongly-typed event names, callback signatures and `trigger` arguments. It defaults to a loose map, so untyped usage keeps working.

```ts
interface CounterEvents {
    increment: (by: number) => void;
    reset: () => void;
}

class Counter extends EventEmitter<CounterEvents> {
    add(n: number) {
        this.trigger("increment", n);   // ✅ ok
        // this.trigger("increment", "x"); // ❌ string is not number
        // this.trigger("nope");           // ❌ unknown event
    }
}

const c = new Counter();
c.on("increment", by => console.log(by.toFixed(0))); // by: number
// c.on("unknown", () => {});                          // ❌ unknown event
```

`UIElement` is itself generic — `UIElement<TEvents>` merges `TEvents` with the built-in `command`/`rendered`/`destroy` events, so subclasses can add their own typed events:

```ts
class MyWidget extends UIElement<{ ready: () => void }> {
    // on/trigger accept "command", "destroy" AND "ready"
}
```

Subscribing to and unsubscribing from events:

```ts
widget.on("command", (args: CommandEventArgs) => {
    console.log("executing", args.name);
});

// one-time handler
widget.once("destroy", () => console.log("destroyed"));

// unsubscribe (filters can be omitted — an omitted filter matches anything)
widget.off("command");
```

The special event name `"all"` receives every triggered event.

The protected `listenTo` / `listenToOnce` methods subscribe one emitter to another's events and track the subscription so it can be released via `stopListening`. On `destroy()`, all of a `UIElement`'s subscriptions are removed automatically.

## DOM helpers

> Previously published as the separate `@brandup/ui-dom` package, now merged into `@brandup/ui`.

All DOM helpers are available through the `DOM` object.

```ts
import { DOM } from "@brandup/ui";

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

### Creating HTML elements

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

// A UIElement child appends its bound element
DOM.tag("div", null, new MyWidget(DOM.tag("span")));
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

## Constants

The names of DOM attributes, properties, and CSS classes are exported as the `UICONSTANTS` namespace:

```ts
import { UICONSTANTS } from "@brandup/ui";

UICONSTANTS.ElemAttributeName;              // "uiElement"   — data attribute holding the typeName
UICONSTANTS.ElemPropertyName;               // "uielement"   — property on the DOM element referencing the UIElement
UICONSTANTS.CommandAttributeName;           // "command"     — data attribute of the command
UICONSTANTS.CommandExecutingCssClassName;   // "executing"   — class applied while an async command is running
```
