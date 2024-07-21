import { ApplicationBuilder } from "brandup-ui-app";
import { ExampleApplicationModel } from "./typings/app";
import { ExampleApplication } from "./app";
import PagesMiddleware from "./middlewares/pages";
import ErrorMiddleware from "./middlewares/error";
import RealtimeMiddleware from "./middlewares/realtime";
import "./styles/styles.less";

const builder = new ApplicationBuilder<ExampleApplicationModel>();

builder
	.useApp(ExampleApplication)
	.useMiddleware(PagesMiddleware({
		routes: {
			'/': { page: () => import("./pages/index"), preload: true },
			'/commands': { page: () => import("./pages/commands") },
			'/navigation': { page: () => import("./pages/navigation") },
			'/forms': { page: () => import("./pages/forms"), preload: true },
			'/ajax': { page: () => import("./pages/ajax") }
		},
		notfound: { page: () => import("./pages/notfound") }
	}))
	.useMiddleware(ErrorMiddleware)
	.useMiddleware(RealtimeMiddleware);

const app = builder.build({ basePath: "/" }, {});

app.run();