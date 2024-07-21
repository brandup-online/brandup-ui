# brandup-ui-app

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui-app](https://www.npmjs.com/package/@brandup/ui-app).

```
npm i @brandup/ui-app@latest
```

## Configure and run application

Configure your application with middlewares and run.

```
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

```
const appElement = document.getElementById("app")
app.run({ ...optional context params }, appElement);
```

## Middlewares

Inject to application lifecycle event methods. Middleware methods are called one after another in the order in which they were registered in the `ApplicationBuilder`.

```
export class PagesMiddleware implements Middleware {
	readonly name: string = "pages"; // unique name of current middleware

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
```

Example SPA navigation middleware: [example/src/frontend/middlewares/pages.ts](/example/src/frontend/middlewares/pages.ts)

Retrivie middleware by unique name:

```
const middleware = app.middleware<PagesMiddleware>("pages");
```

### Async middleware execution

```
export class PagesMiddleware implements Middleware {
	async navigate(context: NavigateContext, next: MiddlewareNext) {
        // Exec before next middleware

		await next();

        // Exec after next middleware
    }
}
```