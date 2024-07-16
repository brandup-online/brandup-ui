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

app.run({ ...context params })
	.then(context => { })
	.catch(reason => { });
```

## Middlewares

Inject to application lifecycle events.

```
export class PagesMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {
    start(context: StartContext, next: () => { }, end: () => { }) {
        console.log("start");

        next(); // call next middleware
    }

    loaded(context: LoadContext, next: () => { }, end: () => { }) {
        console.log("loaded");

        next();
    }

    navigate(context: NavigateContext, next: () => { }, end: () => { }) {
        if (context.replace)
            location.replace(context.url);
        else
            location.assign(context.url);

        end(); // end call navigate tree
    }

    submit(context: SubmitContext, next: () => { }, end: () => { }) {
        console.log("submit");

        next();
    }

    stop(context: StopContext, next: () => { }, end: () => { }) {
        console.log("stop");

        next();
    }
}
```

Example SPA navigation middleware: [example/src/frontend/middlewares/pages.ts](/example/src/frontend/middlewares/pages.ts)