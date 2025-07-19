import { ApplicationBuilder } from "@brandup/ui-app";
import { ExampleApplication } from "../../app";
import { ExampleApplicationModel } from "frontend/typings/app";

import pagesMiddleware from "../../middlewares/pages";
import errorsMiddleware from "../../middlewares/error";
import realtimeMiddleware from "../../middlewares/realtime";

const createApp = (): ApplicationBuilder<ExampleApplicationModel> => {
	const builder = new ApplicationBuilder<ExampleApplicationModel>({});
	builder
		.useApp(ExampleApplication)
		.useMiddleware(pagesMiddleware, {
			routes: {
				'/': { page: () => import("./pages/index"), preload: true },
				'/commands': { page: () => import("./pages/commands") },
				'/navigation': { page: () => import("./pages/navigation") },
				'/forms': { page: () => import("./pages/forms"), preload: true },
				'/ajax': { page: () => import("./pages/ajax") }
			},
			notfound: { page: () => import("./pages/error/notfound") },
			error: { page: () => import("./pages/error/exception") }
		})
		.useMiddleware(errorsMiddleware)
		.useMiddleware(realtimeMiddleware);

	return builder;
}

export default createApp;