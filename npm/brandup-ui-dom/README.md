# brandup-ui-dom

> **⚠️ Deprecated.** This package has been merged into [`@brandup/ui`](https://www.npmjs.com/package/@brandup/ui).
> It now only re-exports `@brandup/ui` for backward compatibility and will not receive further updates.

## Migration

Install `@brandup/ui` and update your imports:

```diff
- import { DOM } from "@brandup/ui-dom";
+ import { DOM } from "@brandup/ui";
```

```bash
npm i @brandup/ui@latest
```

The `DOM` helper and all element types (`ElementOptions`, `CssClass`, `TagChildrenLike`, ...) are unchanged — see the [`@brandup/ui` README](../brandup-ui/README.md#dom-helpers) for documentation.
