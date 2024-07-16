import { ApplicationBuilder } from "brandup-ui-app";
import { PagesMiddleware } from "./middlewares/pages";
import { ErrorMiddleware } from "./middlewares/error";
import { RealtimeMiddleware } from "./middlewares/realtime";
import { ExampleApplicationModel } from "./typings/app";
import { ExampleApplication } from "./app";
import "./styles/styles.less";

const builder = new ApplicationBuilder<ExampleApplicationModel>();

builder
	.useApp(ExampleApplication)
	.useMiddleware(new PagesMiddleware())
	.useMiddleware(new ErrorMiddleware())
	.useMiddleware(new RealtimeMiddleware());

const app = builder.build({ basePath: "/" }, {});

app.run({ first: true });