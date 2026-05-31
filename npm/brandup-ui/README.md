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
class EventEmitter {
    on(eventName: EventName, callback: EventCallbackFunc, context?: any): this;
    once(eventName: EventName, callback: EventCallbackFunc, context?: any): this;
    off(eventName?: EventName | null, callback?: EventCallbackFunc | null, context?: any | null): this;

    protected listenTo(source: EventEmitter, eventName: EventName, callback: EventCallbackFunc): this;
    protected listenToOnce(source: EventEmitter, eventName: EventName, callback: EventCallbackFunc): this;
    protected stopListening(source?: EventEmitter, eventName?: EventName, callback?: EventCallbackFunc): this;
    protected trigger(eventName: string, ...args: any[]): this;
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

## Constants

The names of DOM attributes, properties, and CSS classes are exported as the `UICONSTANTS` namespace:

```ts
import { UICONSTANTS } from "@brandup/ui";

UICONSTANTS.ElemAttributeName;              // "uiElement"   — data attribute holding the typeName
UICONSTANTS.ElemPropertyName;               // "uielement"   — property on the DOM element referencing the UIElement
UICONSTANTS.CommandAttributeName;           // "command"     — data attribute of the command
UICONSTANTS.CommandExecutingCssClassName;   // "executing"   — class applied while an async command is running
```
