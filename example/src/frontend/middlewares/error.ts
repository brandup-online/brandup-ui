import { Middleware, StartContext, NavigateContext } from "brandup-ui-app";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel } from "../typings/app";

export class ErrorMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {

	// Middleware members

	navigate(context: NavigateContext, next: () => void, end: () => void, error: (reason: any) => void) {
		if (context.data["error"])
			throw "Custom error";

		super.navigate(context, next, end, error);
	}
}