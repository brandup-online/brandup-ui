# brandup-ui-dom

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui-dom](https://www.npmjs.com/package/@brandup/ui-dom).

```
npm i @brandup/ui-dom@latest
```

## DOM helper

Методы для простой работы с DOM моделью. Все функции доступны через объект `DOM`.

```ts
import { DOM } from "@brandup/ui-dom";
```

```ts
const DOM = {
    // Поиск элементов
    getById<T extends HTMLElement = HTMLElement>(id: string): T | null;
    getByClass<T extends HTMLElement = HTMLElement>(container: Element, className: string): T | null;
    getByName<T extends HTMLElement = HTMLElement>(name: string): T | null;
    getElementByTagName<T extends HTMLElement = HTMLElement>(container: Element, tagName: string): T | null;
    getElementsByTagName(container: Element, tagName: string): HTMLCollectionOf<Element>;
    queryElement<T extends HTMLElement = HTMLElement>(container: Element, query: string): T | null;
    queryElements<T extends HTMLElement = HTMLElement>(container: Element, query: string): NodeListOf<T>;

    // Перемещение по соседним элементам
    nextElement<T extends HTMLElement = HTMLElement>(current: Element): T | null;
    prevElement<T extends HTMLElement = HTMLElement>(current: Element): T | null;
    nextElementByClass<T extends HTMLElement = HTMLElement>(current: Element, className: string): T | null;
    prevElementByClass<T extends HTMLElement = HTMLElement>(current: Element, className: string): T | null;

    // CSS классы
    addClass(container: Element | null | undefined, selectors: string, cssClass: CssClass): void;
    removeClass(container: Element | null | undefined, selectors: string, cssClass: CssClass): void;

    // Очистка
    empty(container: Element | null | undefined): void;

    // Создание элементов
    tag<T extends keyof HTMLElementTagNameMap>(tagName: T, options?: ElementOptions | CssClass | null, ...children: TagChildrenLike[]): HTMLElementTagNameMap[T];
};
```

### Creation HTML elements

`DOM.tag` создаёт элемент по имени тега. Второй аргумент — либо строка/массив CSS классов (`CssClass`), либо объект `ElementOptions`. Остальные аргументы — дети (`TagChildrenLike`).

```ts
// Класс строкой или массивом
DOM.tag("div", "css-class-name");
DOM.tag("div", ["class-a", "class-b"]);

// Дети: строка вставляется как HTML, число как текст, элемент как есть
DOM.tag("div", "css-class-name", "<p>test</p>");
DOM.tag("div", "css-class-name", DOM.tag("p", null, "test"));

// Несколько детей, в том числе вложенные массивы
DOM.tag("ul", null, [
    DOM.tag("li", null, "1"),
    DOM.tag("li", null, "2")
]);

// Ребёнок-функция получает создаваемый элемент и может вернуть нового ребёнка
DOM.tag("div", null, (elem) => DOM.tag("span", null, "child"));

// Ребёнок-Promise (или функция, возвращающая Promise) добавляется по готовности
DOM.tag("div", null, fetch("/fragment").then(r => r.text()));
```

Полный объект `ElementOptions`:

```ts
interface ElementOptions {
    id?: string;                  // атрибут id
    class?: CssClass;             // CSS класс(ы): строка или массив строк
    command?: string;             // data-command
    dataset?: ElementData;        // произвольные data-* атрибуты
    events?: ElementEvents;       // обработчики событий по имени в нижнем регистре
    styles?: ElementStyles;       // inline-стили (Partial<CSSStyleDeclaration>)
    [name: string]:               // любой другой ключ — обычный атрибут:
        | string | number | boolean | object | null | undefined;
    // null → пустой атрибут, object → JSON.stringify, undefined → игнорируется
}
```

Пример с полным набором опций:

```ts
DOM.tag("button", {
    id: "submit",
    class: ["btn", "btn-primary"],
    command: "submit",
    dataset: { role: "action" },     // data-role="action"
    styles: { color: "red" },
    events: { click: (e) => console.log(e) },
    type: "button",                  // произвольный атрибут
    disabled: null                   // пустой атрибут disabled
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
