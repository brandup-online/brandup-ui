import { Middleware, MiddlewareMethod, MiddlewareNext, InvokeContext } from "./base";

export class MiddlewareInvoker {
	readonly middleware: Middleware;
	private __next?: MiddlewareInvoker;
	private __tail: MiddlewareInvoker = this;

	constructor(middleware: Middleware) {
		this.middleware = middleware;
	}

	next(middleware: Middleware) {
		const invoker = new MiddlewareInvoker(middleware);
		this.__tail.__next = invoker;
		this.__tail = invoker;
	}

	invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<void> {
		return this.__exec(method, context);
	}

	private async __exec(method: string, context: InvokeContext): Promise<void> {
		const nextFunc: MiddlewareNext = () => this.__next ? this.__next.__exec(method, context) : Promise.resolve();

		context.abort.throwIfAborted();

		const methodFunc: MiddlewareMethod = this.middleware[method];
		if (typeof methodFunc === "function") {
			const methodResult: Promise<void> = methodFunc.call(this.middleware, context, nextFunc);

			if (!methodResult || !(methodResult instanceof Promise))
				throw new Error(`Middleware "${this.middleware.name}" method "${method}" is not async.`);

			await methodResult;
		}
		else
			await nextFunc();
	}
}