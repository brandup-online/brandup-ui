import { InvokeContext, Middleware, MiddlewareNext, NavigateContext, StartContext, StopContext, SubmitContext } from "./base";
import CONSTANTS from "../constants";

export const STATE_MIDDLEWARE_NAME = "app-state";
const minLoadTime = 500;

const StateMiddlewareFactory = (): Middleware => {
	let counter: number = 0;
	let timer: number;
	let beginTime: number;

	const begin = (context: InvokeContext) => {
		const prev = counter++;
		console.log(prev);
		window.clearTimeout(timer);

		if (prev === 0) {
			beginTime = Date.now();

			context.app.element?.classList.remove(CONSTANTS.STATE_CLASS.LOADED);
			context.app.element?.classList.add(CONSTANTS.STATE_CLASS.LOADING);
		}
	}

	const end = (context: InvokeContext) => {
		counter--;

		if (counter <= 0) {
			counter = 0;

			const finishTime = Date.now();
			const diffTime = minLoadTime - (finishTime - beginTime);

			if (diffTime > minLoadTime * 0.1) {
				timer = window.setTimeout(() => {
					context.app.element?.classList.add(CONSTANTS.STATE_CLASS.LOADED);

					context.app.element?.classList.remove(CONSTANTS.STATE_CLASS.LOADING);
				}, diffTime);
			}
			else {
				context.app.element?.classList.add(CONSTANTS.STATE_CLASS.LOADED);
				context.app.element?.classList.remove(CONSTANTS.STATE_CLASS.LOADING);
			}
		}
	}

	return {
		name: STATE_MIDDLEWARE_NAME,
		start: async (context: StartContext, next: MiddlewareNext) => {
			begin(context);

			try {
				await next();
			}
			catch (reason) {
				end(context);
				throw reason;
			}
		},
		loaded: async (context: StartContext, next: MiddlewareNext) => {
			try {
				await next();

				context.app.element?.classList.add(CONSTANTS.STATE_CLASS.READY);
			}
			catch (reason) {
				end(context);
				throw reason;
			}
		},
		navigate: async (context: NavigateContext, next: MiddlewareNext) => {
			begin(context);

			try {
				await next();
			}
			finally {
				if (context.source == "first")
					end(context);

				end(context);
			}
		},
		submit: async (context: SubmitContext, next: MiddlewareNext) => {
			try {
				await next();
			}
			finally {
				end(context);
			}
		},
		stop: async (_context: StopContext, next: MiddlewareNext) => {
			await next();
		}
	};
};

export default StateMiddlewareFactory;