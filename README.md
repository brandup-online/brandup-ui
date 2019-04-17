# brandup-ui

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status/brandup-ui-CI?branchName=master)](https://dev.azure.com/brandup/BrandUp%20Core/_build/latest?definitionId=18&branchName=master)

## UIElement

Wrapper with HTMLElemnt.

```
abstract class UIElement {
    abstract typeName: string;
    readonly element: HTMLElement;

    protected setElement(elem: HTMLElement): void;

    protected __createEvent(eventName: string, eventOptions?: IEventOptions): void;
    protected __raiseEvent(eventName: string, eventArgs?: any): boolean;

    addEventListener(eventName: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
    removeEventListener(eventName: string, listener?: EventListenerOrEventListenerObject, useCapture?: boolean): void;
    
    registerCommand(name: string, execute: (commandElem: HTMLElement) => void, canExecute?: (commandElem: HTMLElement) => boolean): void;
    execCommand(name: string, elem: HTMLElement): CommandsExecResult;
    
    protected _onCanExecCommands(): boolean;

    destroy(): void;
}
```