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

// Make the wait abortable without stopping the underlying work
const value = await FuncHelper.abortable(longRunning(), abortController.signal);
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
- `minWaitAsync(func, minTime?, abort?)` — awaits an async operation, padding so it settles no sooner than `minTime` ms. An already-aborted signal rejects immediately, before `func` runs.
- `delay(ms, abort?)` — a promise resolved after `ms` ms; rejects on abort. Throws synchronously if `ms` is negative (`0` is allowed).
- `timeout(promise, ms, abort?)` — races `promise` against `ms` ms; rejects with a `TimeoutError` on timeout, or with the signal's reason on abort. Throws synchronously if `ms ≤ 0`. The underlying `promise` is not cancelled — only the wait ends.
- `abortable(promise, abort?)` — makes *waiting* for `promise` abortable: rejects with the signal's reason on abort. Does not stop the underlying work; without a signal the promise is awaited as-is.
- `TimeoutError` — error class thrown by `timeout` when the time limit is exceeded.

## Polyfills

An opt-in, side-effect-only entry point fills in `AbortSignal` APIs that older runtimes may lack — `AbortSignal.prototype.throwIfAborted`, `AbortSignal.timeout` and `AbortSignal.any`. Import it once, as early as possible (e.g. in your entry module):

```TypeScript
import "@brandup/ui-helpers/polyfill";
```

Each implementation installs only when missing, so native behaviour is preserved where available. Types ship with the TypeScript `ESNext` lib; this module provides just the runtime. It is excluded from tree-shaking (`sideEffects`), so a bare import is never dropped by the bundler.
