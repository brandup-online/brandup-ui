# brandup-ui

Класс UIElement - wrapper для HTMLElemnt. Служит для реализации бизнес-логики для элемента, который задаётся через метод **setElement**.

**NPM Package:** [brandup-ui](https://www.npmjs.com/package/brandup-ui)

```
abstract class UIElement {
    abstract typeName: string;
    readonly element: HTMLElement;

    protected setElement(elem: HTMLElement): void;

    protected defineEvent(eventName: string, eventOptions?: IEventOptions): void;
    protected raiseEvent(eventName: string, eventArgs?: any): boolean;

    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    dispatchEvent(event: Event): boolean;

    registerCommand(name: string, execute: CommandDelegate, canExecute: CommandCanExecuteDelegate = null): void;
    registerAsyncCommand(name: string, delegate: CommandAsyncDelegate): void;
    hasCommand(name: string): boolean;
    execCommand(name: string, elem: HTMLElement): CommandExecutionResult;
    
    protected _onRenderElement(_elem: HTMLElement);
    protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean;

    destroy(): void;
}
```

Возможности:
- Обработка комманд из интерфейса.
- Обработка событий элемента.

## Command handling

Класс UIElement позволяет регистрировать обработчики комманд, которые определяются в разметке HTML элемента.

```
<button data-command="send">Send</button>

this.registerCommand("send", (elem: HTMLElement, context: CommandContext) => { elem.innerHTML = "ok"; });
```

Так же можно регистрировать асинхронные команды:

```
this.registerAsyncCommand("command1-async", (context: CommandAsyncContext) => {
    context.timeout = 3000;

    context.target.innerHTML = "Loading...";
    const t = window.setTimeout(() => {
        context.target.innerHTML = "Ok";
        context.complate();
    }, 2000);

    context.timeoutCallback = () => {
        clearTimeout(t);
    };
});
```

Команды вызываются по событию click.

Во время выполнения команды, у элемента добавляется стиль **executing**.