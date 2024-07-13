import { Middleware, StartContext } from "brandup-ui-app";
import { ExampleApplication } from "../app";
import { ExampleApplicationModel } from "../typings/app";

export class RealtimeMiddleware extends Middleware<ExampleApplication, ExampleApplicationModel> {
	start(context: StartContext, next: () => void, end: () => void) {
		super.start(context, next, end);
	}

	subscribe(id: string) {
		console.log(`subscribe: ${id}`)
	}
}