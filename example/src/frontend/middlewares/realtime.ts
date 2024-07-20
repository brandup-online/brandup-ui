import { Middleware, MiddlewareNext, StartContext, NavigateContext, SubmitContext } from "brandup-ui-app";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel, PageNavigationData } from "../typings/app";

export class RealtimeMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {

	// Middleware members

	start(context: StartContext, next: MiddlewareNext) {
		return next();
	}

	async navigate(context: NavigateContext<PageNavigationData>, next: MiddlewareNext) {
		if (context.data.error) {
			alert("error no good");

			throw "realtime navigate: shouldn't have";
		}

		console.log("realtime navigate: ok");

		return next();
	}

	submit(context: SubmitContext, next: MiddlewareNext) {
		console.log("realtime submit: ok");

		return next();
	}

	// RealtimeMiddleware members

	subscribe(id: string) {
		console.log(`subscribe: ${id}`)
	}
}