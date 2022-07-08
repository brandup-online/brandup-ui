# brandup-ui

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status/brandup-ui-CI?branchName=master)](https://dev.azure.com/brandup/BrandUp%20Core/_build/latest?definitionId=18&branchName=master)

## UIElement

Класс обёртка для HTMLElemnt.

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

    registerCommand(name: string, execute: CommandExecuteDelegate, canExecute: CommandCanExecuteDelegate = null): void;
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

