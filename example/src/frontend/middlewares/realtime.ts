import { Middleware, StartContext, NavigateContext, SubmitContext } from "brandup-ui-app";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel, PageNavigationData } from "../typings/app";

export class RealtimeMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {

	// Middleware members

	start(context: StartContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		next();
	}

	async navigate(context: NavigateContext<PageNavigationData>) {
		if (context.data.error) {
			alert("error no good");

			throw "realtime navigate: shouldn't have";
		}

		console.log("realtime navigate: ok");
	}

	submit(context: SubmitContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		console.log("realtime submit: ok");

		next();
	}

	// RealtimeMiddleware members

	subscribe(id: string) {
		console.log(`subscribe: ${id}`)
	}
}