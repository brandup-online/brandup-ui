import { Middleware, MiddlewareNext, NavigateContext } from "brandup-ui-app";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel, PageNavigationData } from "../typings/app";

export class ErrorMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {

	// Middleware members

	async navigate(context: NavigateContext<PageNavigationData>, next: MiddlewareNext) {
		if (context.data.error)
			throw "Custom error";

		await next();
	}
}