# brandup-ui-app

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

[TOC]

## Installation

Install NPM package [@brandup/ui-app](https://www.npmjs.com/package/@brandup/ui-app).

```
npm i @brandup/ui-app
```

## Configure and run application

Configure your application with middlewares and run.

```typescript
import { ApplicationBuilder } from "@brandup/ui-app";
import { PagesMiddleware } from "./middlewares/pages";
import "./styles.less";

// Customize application model
interface ExampleApplicationModel extends ApplicationModel {
}

// Customize application type
export class ExampleApplication extends Application<ExampleApplicationModel> {
}

const builder = new ApplicationBuilder<ExampleApplicationModel>();
builder
	.useApp(ExampleApplication)
	.useMiddleware(() => new PagesMiddleware());

const appModel: ExampleApplicationModel = {};
const app = builder.build<ExampleApplicationModel>({ basePath: "/" }, appModel);

app.run({ ...optional context params })
	.then(navContext => { })
	.catch(reason => { });
```

Default HTMLElement of application is `document.body`. Set custom element:

```typescript
const appElement = document.getElementById("app")
app.run({ ...optional context params }, appElement);
```

## Navigation

Example links for application navigation `app.nav({ url: "url" })`:

```html
<a href="url" class="applink">text</a>
<button data-nav-url="url">text</button>
```

Replace current url `app.nav({ url: "url", replace: true })`:

```html
<a href="url" class="applink" data-nav-replace>text</a>
<button data-nav-url="url" data-nav-replace>text</button>
```

The element's click event will start a chain of `navigate` method calls for all middleware.

During navigation and until it is completed, the `loading` class is added to the element that started the navigation.

## Submit form

```html
<form class="appform">
	<input type="text" name="value" />
</form>
```

The form's submit event will start a chain of `submit` method calls for all middleware.

If the form method is `GET`, then navigation with the form data will start.

## Middlewares

Inject to application lifecycle event methods. Middleware methods are called one after another in the order in which they were registered in the `ApplicationBuilder`.

```typescript
class PagesMiddleware implements Middleware {
	name = "pages"; // unique name of this middleware

    start(context: StartContext<ExampleApplication>, next: MiddlewareNext) {
        console.log("start");

		// context.app - access to application members
		// context.data - get or set context data

		return next();
    }

    async loaded(context: StartContext<ExampleApplication>, next: MiddlewareNext) {
        console.log("loaded");

		return next();
    }

    async navigate(context: NavigateContext<ExampleApplication, PageNavigationData>, next: MiddlewareNext) {
        if (context.replace)
            location.replace(context.url);
        else
            location.assign(context.url);

		return next();
    }

    async submit(context: SubmitContext<ExampleApplication>, next: MiddlewareNext) {
        console.log("submit");

		return next();
    }

    async stop(context: StopContext<ExampleApplication>, next: MiddlewareNext) {
        console.log("stop");

		return next();
    }
}

export default () => new PagesMiddleware();
```

Example SPA navigation middleware: [example/src/frontend/middlewares/pages.ts](/example/src/frontend/middlewares/pages.ts)

Retrivie middleware by unique name:

```typescript
const middleware = app.middleware<PagesMiddleware>("pages");
```

### Async execution

```typescript
export class PagesMiddleware implements Middleware {
	async navigate(context: NavigateContext, next: MiddlewareNext) {
        // Exec before next middleware

		await next();

        // Exec after next middleware
    }
}
```

### Redirect navigation

```typescript
export class AuthMiddleware implements Middleware {
	async navigate(context: NavigateContext, next: MiddlewareNext) {
        await context.redirect({ url: "url" });
    }

	async submit(context: SubmitContext, next: MiddlewareNext) {
        await context.redirect({ url: "url" });
    }
}
```

The `redirect` method will always throw an exception and end the current navigation.