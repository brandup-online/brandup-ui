import { Middleware, MiddlewareMethod, MiddlewareNext, InvokeContext } from "./base";

export class MiddlewareInvoker {
	readonly middleware: Middleware;
	private __next?: MiddlewareInvoker;

	constructor(middleware: Middleware) {
		this.middleware = middleware;
	}

	next(middleware: Middleware) {
		if (this.__next)
			this.__next.next(middleware);
		else
			this.__next = new MiddlewareInvoker(middleware);
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