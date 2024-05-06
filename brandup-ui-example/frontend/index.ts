import { ApplicationBuilder } from "brandup-ui-app";
import { PagesMiddleware } from "./middlewares/pages";
import "./styles.less";
import { RealtimeMiddleware } from "./middlewares/realtime";

const builder = new ApplicationBuilder();

builder
    .useMiddleware(new PagesMiddleware())
    .useMiddleware(new RealtimeMiddleware());

const app = builder.build({ basePath: "/" }, {});

app.start(() => { console.log("app start callback"); });
app.load(() => { console.log("app load callback"); });
app.nav({ url: null, replace: true });