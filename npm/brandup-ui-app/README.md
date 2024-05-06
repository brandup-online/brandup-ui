# brandup-ui-app

## App start

Configure your application with middlewares and run.

```
import { ApplicationBuilder } from "brandup-ui-app";
import { PagesMiddleware } from "./middlewares/pages";
import "./styles.less";

interface WebsiteModel extends ApplicationModel {
}

const appModel: WebsiteModel = {}

const builder = new ApplicationBuilder();
builder.useMiddleware(new PagesMiddleware());

const app = builder.build<WebsiteModel>({ basePath: "/" }, appModel);

app.init();
app.load();
```

## App middlewares

Inject to application lifecycle events.

```
export class PagesMiddleware extends Middleware<WebsiteModel> {
    start(_context, next) {
        console.log("start");

        next();
    }

    loaded(_context, next) {
        console.log("loaded");

        next();
    }

    navigate(context: NavigateContext) {
        if (context.replace)
            location.replace(context.url);
        else
            location.assign(context.url);

        return;
    }

    stop(_context, next) {
        console.log("stop");

        next();
    }
}
```