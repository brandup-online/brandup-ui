import { Middleware, StartContext, NavigateContext } from "brandup-ui-app";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel, PageNavigationData } from "../typings/app";

export class ErrorMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {

	// Middleware members

	async navigate(context: NavigateContext<PageNavigationData>) {
		if (context.data.error)
			throw "Custom error";
	}
}