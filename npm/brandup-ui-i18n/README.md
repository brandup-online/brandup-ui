# brandup-ui-i18n

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)](https://dev.azure.com/brandup/BrandUp%20Core/_build)

Lightweight type-safe localization for web applications.

The engine is generic: it does not know the concrete set of languages, the application passes it to `createI18n`. Keys are extracted from the lambda source (`m => m.a.b.c`), which gives autocomplete and refactoring safety. With `resolveJsonModule` TypeScript checks every dictionary against the model interface, so a missing key is caught at build time.

## Installation

Install NPM package [@brandup/ui-i18n](https://www.npmjs.com/package/@brandup/ui-i18n).

```bash
npm i @brandup/ui-i18n@latest
```

## Usage

```TypeScript
import { createI18n } from "@brandup/ui-i18n";

export type ApplicationLanguage = "en" | "ru" | "ar" | "zh";

const i18n = createI18n<ApplicationLanguage>({
    lang: document.documentElement.lang, // raw value; region "ar-SA" is reduced to "ar"
    supported: ["en", "ru", "ar", "zh"],
    default: "en",
    rtl: ["ar"],
});

export const { CURRENT_LANG, IS_RTL, buildLocalization } = i18n;
```

Register a namespace with lazy dictionary loading (only the current and the default language are loaded):

```TypeScript
interface CommonLocaleModel {
    layout: { footer: { copy: string } };
}

const localize = await buildLocalization<CommonLocaleModel>(
    "common", builder => builder
        .add("en", () => import("./en.json"))
        .add("ru", () => import("./ru.json"))
);

localize.t(m => m.layout.footer.copy, { year: "2025" });
localize.t("layout.footer.copy"); // safe string path
```

## Behaviour

- **Fallback:** current language, then default language, then the key path itself (shown in the UI instead of crashing).
- **RTL:** `IS_RTL` for client-side logic; the `dir` attribute on `<html>` is set by the server.
- **Namespaces:** a name can be registered once; a repeated `buildLocalization` for the same name is rejected, including while the first one is still loading. A build that failed is not cached, so it can be retried.
- **Testability:** `lang` is accepted as a string, no DOM is required.
- **Lambda keys:** arrow and transpiled `function` forms are supported, including block bodies. If a minifier ever breaks the parsing, use the string form `t("a.b")`.

Depends on `@brandup/ui-helpers` (`ObjectHelper.getProperty`, `formatText`).
