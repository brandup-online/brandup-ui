# brandup-ui

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui](https://www.npmjs.com/package/@brandup/ui).

```
npm i @brandup/ui@latest
```

## UIElement

`UIElement` - wrapper для `HTMLElement`, который позволяет привязать к нему свою бизнес логику.

Возможности:
- Обработка комманд, объявленных в разметке `HTMLElement`, который связан с `UIElement`.
- Подписка на события через `EventEmitter`, от которого наследуется `UIElement`.

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

`UIElement` — абстрактный класс. Наследник задаёт `typeName` и привязывает DOM-элемент через `setElement`. Привязать элемент можно только один раз; повторная привязка (или привязка чужого элемента) бросает исключение.

```ts
import { UIElement } from "@brandup/ui";

class MyWidget extends UIElement {
    typeName = "MyWidget";

    constructor(elem: HTMLElement) {
        super();
        this.setElement(elem);
    }

    protected _onRenderElement(elem: HTMLElement) {
        // инициализация разметки
    }
}
```

Расширение `HTMLElement.prototype.ui` позволяет привязать `UIElement` через фабрику и вернуть сам элемент:

```ts
document.getElementById("widget")!.ui(elem => new MyWidget(elem));
```

Привязанный `UIElement` доступен на узле через свойство `node.uielement`.

## UI commands

`UIElement` позволяет регистрировать обработчики комманд, которые объявляются в разметке через атрибут `data-command`.

```html
<button data-command="send">Send</button>
```

```ts
this.registerCommand("send", (context: CommandContext) => {
    context.target.innerHTML = "ok";
});
```

Можно регистрировать асинхронные обработчики команд — достаточно вернуть `Promise`:

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

Третий аргумент `canExecute` позволяет ограничить выполнение команды:

```ts
this.registerCommand(
    "submit",
    (context) => { /* ... */ },
    (context) => context.target.dataset.enabled === "true"
);
```

Команды срабатывают по событию `click`. Поиск обработчика идёт вверх по DOM от элемента с атрибутом `data-command` до ближайшего `UIElement`, в котором эта команда зарегистрирована.

Во время выполнения асинхронной команды у целевого элемента добавляется CSS-класс **executing** (удаляется по завершении `Promise`).

Сигнатуры типов команд:

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

Перед выполнением команды `UIElement` триггерит событие `command` с аргументами `CommandEventArgs` (`{ element, name }`).

## UI Events

`UIElement` наследуется от класса `EventEmitter`.

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

Подписка и отписка на события:

```ts
widget.on("command", (args: CommandEventArgs) => {
    console.log("executing", args.name);
});

// одноразовый обработчик
widget.once("destroy", () => console.log("destroyed"));

// отписка (фильтры можно опускать — пропущенный фильтр совпадает с любым)
widget.off("command");
```

Специальное имя события `"all"` получает каждое триггеримое событие.

Защищённые методы `listenTo` / `listenToOnce` подписывают один эмиттер на события другого и отслеживают подписку, чтобы её можно было освободить через `stopListening`. При `destroy()` все подписки `UIElement` снимаются автоматически.

## Constants

Имена DOM-атрибутов, свойств и CSS-классов экспортируются как пространство имён `UICONSTANTS`:

```ts
import { UICONSTANTS } from "@brandup/ui";

UICONSTANTS.ElemAttributeName;              // "uiElement"   — data-атрибут с typeName
UICONSTANTS.ElemPropertyName;               // "uielement"   — свойство на DOM-элементе со ссылкой на UIElement
UICONSTANTS.CommandAttributeName;           // "command"     — data-атрибут команды
UICONSTANTS.CommandExecutingCssClassName;   // "executing"   — класс на время выполнения async-команды
```
