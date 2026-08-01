# brandup-ui

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)](https://dev.azure.com/brandup/BrandUp%20Core/_build)

Very fast and compact UI framework.

## @brandup/ui

Core UI framework: `UIElement` (DOM-bound components with commands), an `EventEmitter` with typed event maps, DOM helpers (`DOM.tag`, queries, classes) and a fine-grained reactivity layer (`reactive`/`computed`/`bind`).

[![NPM](https://img.shields.io/npm/v/brandup-ui.svg)](https://www.npmjs.com/package/@brandup/ui)

Read [documentation](npm/brandup-ui/README.md)

## @brandup/ui-dom

**Deprecated** — merged into [`@brandup/ui`](npm/brandup-ui/README.md). This package now only re-exports `@brandup/ui` for backward compatibility; import `DOM` and the element types from `@brandup/ui` instead.

[![NPM](https://img.shields.io/npm/v/brandup-ui-dom.svg)](https://www.npmjs.com/package/@brandup/ui-dom)

Read [migration notes](npm/brandup-ui-dom/README.md)

## @brandup/ui-app

SPA application infrastructure: an `Application` built from middlewares with async navigation, form submit and lifecycle hooks.

[![NPM](https://img.shields.io/npm/v/brandup-ui-app.svg)](https://www.npmjs.com/package/@brandup/ui-app)

Read [documentation](npm/brandup-ui-app/README.md)

## @brandup/ui-ajax

AJAX request (fetch and `XMLHttpRequest`) and a sequential request queue.

[![NPM](https://img.shields.io/npm/v/brandup-ui-ajax.svg)](https://www.npmjs.com/package/@brandup/ui-ajax)

Read [documentation](npm/brandup-ui-ajax/README.md)

## @brandup/ui-helpers

Small utility helpers: strings, objects, types, words (pluralization), GUID and async timing.

[![NPM](https://img.shields.io/npm/v/brandup-ui-helpers.svg)](https://www.npmjs.com/package/@brandup/ui-helpers)

Read [documentation](npm/brandup-ui-helpers/README.md)
