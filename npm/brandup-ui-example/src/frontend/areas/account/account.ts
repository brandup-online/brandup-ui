import { ApplicationBuilder } from "@brandup/ui-app";
import { ExampleApplication } from "../../app";
import { ExampleApplicationModel } from "../../typings/app";

import pagesMiddleware from "../../middlewares/pages";

const createApp = (): ApplicationBuilder<ExampleApplicationModel> => {
	const builder = new ApplicationBuilder<ExampleApplicationModel>({});
	builder
		.useApp(ExampleApplication)
		.useMiddleware(pagesMiddleware, {
			routes: {
				'/': { page: () => import("./pages/index"), preload: true }
			},
			notfound: { page: () => import("./pages/error/notfound") },
			error: { page: () => import("./pages/error/exception") }
		});

	return builder;
}

export default createApp;