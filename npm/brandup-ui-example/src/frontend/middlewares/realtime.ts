import { Middleware, MiddlewareNext, NavigateContext, SubmitContext } from "@brandup/ui-app";
import { ExampleApplication } from "../app";
import { PageNavigationData } from "../typings/app";

export const REALTIME_NAME = "realtime";

export interface RealtimeMiddleware extends Middleware {
	subscribe: (id: string) => void;
}

export default (): RealtimeMiddleware => {
	return {
		name: "realtime",
		navigate: (context: NavigateContext<ExampleApplication, PageNavigationData>, next: MiddlewareNext) => {
			if (context.data.error) {
				alert("error no good");

				throw "realtime navigate: shouldn't have";
			}

			console.log("realtime navigate: ok");

			return next();
		},
		submit: (_context: SubmitContext, next: MiddlewareNext) => {
			console.log("realtime submit: ok");

			return next();
		},
		subscribe: (id: string) => {
			console.log(`subscribe: ${id}`)
		}
	};
};