# brandup-ui-app

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [brandup-ui-app](https://www.npmjs.com/package/brandup-ui-app).

```
npm i brandup-ui-app@latest
```

## Configure and run application

Configure your application with middlewares and run.

```
import { ApplicationBuilder } from "brandup-ui-app";
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
	.useMiddleware(new PagesMiddleware());

const appModel: ExampleApplicationModel = {};
const app = builder.build<ExampleApplicationModel>({ basePath: "/" }, appModel);

app.run({ ...optional context params })
	.then(context => { })
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
export class PagesMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {
    start(context: StartContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
        console.log("start");

        next(); // call next middleware
		// end(); // end call start hierarhy of next middlewares
		// error(); // error signal for call hierarhy
    }

    async loaded(context: StartContext) {
        console.log("loaded");
    }

    navigate(context: NavigateContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
        if (context.replace)
            location.replace(context.url);
        else
            location.assign(context.url);

        end(); // end call navigate tree
    }

    submit(context: SubmitContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
        console.log("submit");

        next();
    }

    stop(context: StopContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
        console.log("stop");

        next();
    }
}
```

Example SPA navigation middleware: [example/src/frontend/middlewares/pages.ts](/example/src/frontend/middlewares/pages.ts)

### Async middleware execution

```
export class PagesMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {
	async navigate(context: NavigateContext) {
        await ...

		// return false; // end call next middlewares.
		return true; // or nothing
    }
}
```

Middleware method return variants:

- `true`, any value or nothing - call next middleware
- `false` - end call next middlewares.