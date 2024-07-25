import { Application } from "../../source/app";
import { ContextData, Middleware, MiddlewareNext, StartContext } from "../../source/middlewares/base";
import { MiddlewareInvoker } from "../../source/middlewares/invoker";

const app = new Application({ basePath: "/" }, {});

it("Success next execution", async () => {
	const middleware = createTestMiddleware();
	const secondMiddleware = createSecondMiddleware();
	const invoker = new MiddlewareInvoker(middleware);
	invoker.next(secondMiddleware);

	const abort = new AbortController();
	const context: StartContext<Application, TestContextData> = {
		abort: abort.signal,
		app,
		data: {
			mode: "next",
			pre: false,
			post: false,
			secondPre: false,
			secondPost: false
		}
	};

	await invoker.invoke("start", context);

	expect(context.data.pre).toEqual(true);
	expect(context.data.post).toEqual(true);

	expect(context.data.secondPre).toEqual(true);
	expect(context.data.secondPost).toEqual(true);
});

it("End execution", async () => {
	const middleware = createTestMiddleware();
	const secondMiddleware = createSecondMiddleware();
	const invoker = new MiddlewareInvoker(middleware);
	invoker.next(secondMiddleware);

	const abort = new AbortController();
	const context: StartContext<Application, TestContextData> = {
		abort: abort.signal,
		app,
		data: {
			mode: "end",
			pre: false,
			post: false,
			secondPre: false,
			secondPost: false
		}
	};

	await invoker.invoke("start", context);

	expect(context.data.pre).toEqual(true);
	expect(context.data.post).toEqual(false);

	expect(context.data.secondPre).toEqual(false);
	expect(context.data.secondPost).toEqual(false);
});

it("Reject by async exception", async () => {
	const middleware = createTestMiddleware();
	const secondMiddleware = createSecondMiddleware();
	const invoker = new MiddlewareInvoker(middleware);
	invoker.next(secondMiddleware);

	const abort = new AbortController();
	const context: StartContext<Application, TestContextData> = {
		abort: abort.signal,
		app,
		data: {
			mode: "error",
			pre: false,
			post: false,
			secondPre: false,
			secondPost: false
		}
	};

	await expect(invoker.invoke("start", context))
		.rejects
		.toThrow(new Error("async error"));

	expect(context.data.pre).toEqual(true);
	expect(context.data.post).toEqual(false);

	expect(context.data.secondPre).toEqual(false);
	expect(context.data.secondPost).toEqual(false);
});

it("Reject by sync exception", async () => {
	const middleware = createTestMiddleware();
	const secondMiddleware = createSecondMiddleware();
	const invoker = new MiddlewareInvoker(middleware);
	invoker.next(secondMiddleware);

	const abort = new AbortController();
	const context: StartContext<Application, TestContextData> = {
		abort: abort.signal,
		app,
		data: {
			mode: "error-sync",
			pre: false,
			post: false,
			secondPre: false,
			secondPost: false
		}
	};

	await expect(invoker.invoke("start", context))
		.rejects
		.toThrow(new Error("sync error"));

	expect(context.data.pre).toEqual(true);
	expect(context.data.post).toEqual(false);

	expect(context.data.secondPre).toEqual(false);
	expect(context.data.secondPost).toEqual(false);
});

it("Method return is not Promise", async () => {
	const middleware = createTestMiddleware();
	const secondMiddleware = createSecondMiddleware();
	const invoker = new MiddlewareInvoker(middleware);
	invoker.next(secondMiddleware);

	const abort = new AbortController();
	const context: StartContext<Application, TestContextData> = {
		abort: abort.signal,
		app,
		data: {
			mode: "default",
			pre: false,
			post: false,
			secondPre: false,
			secondPost: false
		}
	};

	await expect(invoker.invoke("start", context))
		.rejects
		.toThrow(new Error("Middleware \"test\" method \"start\" is not async."));

	expect(context.data.pre).toEqual(true);
	expect(context.data.post).toEqual(false);

	expect(context.data.secondPre).toEqual(false);
	expect(context.data.secondPost).toEqual(false);
});

const createTestMiddleware = (): Middleware => {
	return {
		name: "test",
		start: (context: StartContext<Application, TestContextData>, next: MiddlewareNext) => {
			context.data.pre = true;

			switch (context.data.mode) {
				case "next": {
					return next()
						.then(() => {
							context.data.post = true;
						});
				}
				case "end":
					return Promise.resolve();
				case "error":
					return Promise.reject(new Error("async error"));
				case "error-sync":
					throw new Error("sync error");
				default:
					return <any>{};
			}
		}
	};
}

const createSecondMiddleware = (): Middleware => {
	return {
		name: "test-second",
		start: async (context: StartContext<Application, TestContextData>, next: MiddlewareNext) => {
			context.data.secondPre = true;

			await next();

			context.data.secondPost = true;
		}
	};
}

interface TestContextData extends ContextData {
	mode: "next" | "end" | "error" | "error-sync" | "default";
	pre: boolean;
	post: boolean;
	secondPre: boolean;
	secondPost: boolean;
}