import { ApplicationBuilder } from "brandup-ui-app";
import { PagesMiddleware } from "./middlewares/pages";
import { RealtimeMiddleware } from "./middlewares/realtime";
import { ExampleApplicationModel } from "./typings/app";
import { ExampleApplication } from "./app";
import "./styles/styles.less";

const builder = new ApplicationBuilder<ExampleApplicationModel>();

builder
	.useApp(ExampleApplication)
	.useMiddleware(new PagesMiddleware())
	.useMiddleware(new RealtimeMiddleware());

const app = builder.build({ basePath: "/" }, {});

app.start(() => { console.log("app start callback"); });
app.load(() => { console.log("app load callback"); });
app.nav({ replace: true });