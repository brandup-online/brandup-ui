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
- Обработка комманд вызванных внутри `HTMLElement`, который связан с `UIElement`.
- Обработка событий элемента `HTMLElement`, который связан с `UIElement`.

```
abstract class UIElement {
    abstract typeName: string;
    readonly element: HTMLElement | undefined;

    protected setElement(elem: HTMLElement): void;

    protected defineEvent(eventName: string, eventOptions?: EventInit): void;
    protected raiseEvent(eventName: string, eventArgs?: any): boolean;

    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener(type: string, listener?: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
    dispatchEvent(event: Event): boolean;

    registerCommand(name: string, execute: CommandDelegate, canExecute?: CommandCanExecuteDelegate): void;
    hasCommand(name: string): boolean;
    
    protected _onRenderElement(_elem: HTMLElement);
    protected _onCanExecCommand(_name: string, _elem: HTMLElement): boolean;

	onDestroy(callback: VoidFunction | UIElement | Element);
    destroy(): void;
}
```

## Command handling

Класс UIElement позволяет регистрировать обработчики комманд, которые определяются в разметке HTML элемента.

```
<button data-command="send">Send</button>

this.registerCommand("send", (context: CommandContext) => { context.target.innerHTML = "ok"; });
```

Так же можно регистрировать асинхронные команды:

```
this.registerCommand("command1-async", (context: CommandContext) => {
	return Promise<void>(resolve => {
		context.target.innerHTML = "Loading...";
		const t = window.setTimeout(() => {
			context.target.innerHTML = "Ok";
			resolve();
		}, 2000);
	});
});
```

Команды срабатывают по событию `click`.

Во время выполнения команды, у элемента добавляется стиль **executing**.