# brandup-ui-helpers

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui-helpers](https://www.npmjs.com/package/@brandup/ui-helpers).

```
npm i @brandup/ui-helpers@latest
```

## Helper groups

The package exposes the following named helper groups:

| Import | Module |
| --- | --- |
| `ObjectHelper` | object property access by path |
| `TypeHelper` | runtime type checks |
| `FuncHelper` | timing / async helpers |
| `WordHelper` | word pluralization |
| `Guid` | GUID generation |
| `formatText` | string template formatting |

```TypeScript
import { ObjectHelper, TypeHelper, FuncHelper, WordHelper, Guid, formatText } from "@brandup/ui-helpers";
```

## String helpers

`formatText` substitutes `{...}` placeholders in a template.

Format with model values (placeholders are dot-separated property paths):

```TypeScript
import { formatText } from "@brandup/ui-helpers";

const result = formatText("Hello, {name}", { name: "Dmitry" }); // Hello, Dmitry
```

Format with positional arguments (placeholders are zero-based indexes):

```TypeScript
const result = formatText("Hello, {0}", "Dmitry"); // Hello, Dmitry
```

## Format text

`formatText` substitutes `{...}` placeholders in a template — by name from a model object, or by zero-based index from positional arguments.

```TypeScript
import { formatText } from "@brandup/ui-helpers";

formatText("Hello, {name}", { name: "Dmitry" }); // "Hello, Dmitry"
formatText("Hello, {0}", "Dmitry");              // "Hello, Dmitry"
```

## Object helpers

`ObjectHelper` reads nested values by a dot-separated path.

```TypeScript
import { ObjectHelper } from "@brandup/ui-helpers";

const model = { header: { value: "Item" } };

ObjectHelper.getProperty(model, "header.value"); // "Item"
ObjectHelper.hasProperty(model, "header.value"); // true
```

- `getProperty(obj, path)` — returns the resolved value; `null` when `obj` is falsy, `undefined` when any path segment is missing or a mid-path value is `null`/primitive.
- `hasProperty(obj, path)` — returns `true` if every segment of the path exists; safely returns `false` when a mid-path value is `null` or a primitive.

## Type helpers

`TypeHelper` provides runtime type checks.

```TypeScript
import { TypeHelper } from "@brandup/ui-helpers";

TypeHelper.isFunction(() => {}); // true
TypeHelper.isString("text");     // true
```

- `isFunction(value)` — `true` if the value is a function.
- `isString(value)` — `true` for string primitives and `String` instances.

## Word helpers

`WordHelper.getWordEnd` picks a grammatical ending that agrees with a count (Russian-style pluralization).

```TypeScript
import { WordHelper } from "@brandup/ui-helpers";

WordHelper.getWordEnd(1, "товар", "", "а", "ов"); // товар
WordHelper.getWordEnd(3, "товар", "", "а", "ов"); // товара
WordHelper.getWordEnd(5, "товар", "", "а", "ов"); // товаров
```

- `getWordEnd(count, word, one?, two?, five?)` — appends `one` for counts ending in 1, `two` for 2–4, and `five` for 0/5–9 and 11–20.

## Guid helpers

`Guid` generates and exposes UUID values.

```TypeScript
import { Guid } from "@brandup/ui-helpers";

const id = Guid.createGuid(); // e.g. "3f2a1b4c-9d8e-4a23-b123-456789abcdef"
Guid.empty;                   // "00000000-0000-0000-0000-000000000000"
```

- `createGuid()` — a new RFC 4122 UUID v4 string (lowercase, uses `crypto.randomUUID()`).
- `empty` — the all-zero UUID constant.

## Func helpers

`FuncHelper` contains timing and async utilities.

```TypeScript
import { FuncHelper } from "@brandup/ui-helpers";

// Resolve after 500ms (cancellable via AbortSignal)
await FuncHelper.delay(500);

// Keep a loading state visible for at least 1000ms
const data = await FuncHelper.minWaitAsync(() => loadData(), 1000);

// Reject with TimeoutError if the request takes longer than 5000ms
const result = await FuncHelper.timeout(fetch("/api"), 5000);
```

Detect a timeout by checking the error type:

```TypeScript
import { FuncHelper } from "@brandup/ui-helpers";

try {
    const result = await FuncHelper.timeout(fetch("/api"), 5000);
} catch (e) {
    if (e instanceof FuncHelper.TimeoutError) {
        console.log("Request timed out");
    }
}
```

- `minWait(func, minTime?)` — wraps a callback so it runs no sooner than `minTime` ms after wrapping.
- `minWaitAsync(func, minTime?, abort?)` — awaits an async operation, padding so it settles no sooner than `minTime` ms.
- `delay(time, abort?)` — a promise resolved after `time` ms; rejects on abort.
- `timeout(promise, timeout, abort?)` — races `promise` against `timeout` ms; rejects with a `TimeoutError` on timeout. Throws synchronously if `timeout ≤ 0`.
- `TimeoutError` — error class thrown by `timeout` when the time limit is exceeded.
