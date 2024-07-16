import { Middleware, StartContext, NavigateContext, SubmitContext } from "brandup-ui-app";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel } from "../typings/app";

export class RealtimeMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {

	// Middleware members

	start(context: StartContext, next: () => void, end: () => void, error: (reason: any) => void) {
		super.start(context, next, end, error);
	}

	navigate(context: NavigateContext, next: () => void, end: () => void, error: (reason: any) => void) {
		if (context.data["error"]) {
			alert("error no good");
			console.error("realtime navigate: shouldn't have");
		}

		console.log("realtime navigate: ok");

		super.navigate(context, next, end, error);
	}

	submit(context: SubmitContext, next: () => void, end: () => void, error: (reason: any) => void) {
		console.log("realtime submit: ok");

		super.submit(context, next, end, error);
	}

	// RealtimeMiddleware members

	subscribe(id: string) {
		console.log(`subscribe: ${id}`)
	}
}