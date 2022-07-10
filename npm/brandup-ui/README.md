# brandup-ui

����� UIElement - wrapper ��� HTMLElemnt. ������ ��� ���������� ������-������ ��� ��������, ������� ������� ����� ����� **setElement**.

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

�����������:
- ��������� ������� �� ����������.
- ��������� ������� ��������.

## Command handling

����� UIElement ��������� �������������� ����������� �������, ������� ������������ � �������� HTML ��������.

```
<button data-command="send">Send</button>

this.registerCommand("send", (elem: HTMLElement, context: CommandContext) => { elem.innerHTML = "ok"; });
```

��� �� ����� �������������� ����������� �������:

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

������� ���������� �� ������� click.

�� ����� ���������� �������, � �������� ����������� ����� **executing**.