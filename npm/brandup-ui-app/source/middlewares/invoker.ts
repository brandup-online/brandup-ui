import { Middleware, MiddlewareMethod, MiddlewareNext, InvokeContext } from "./base";

/** Runs a chain of middlewares, invoking the named method on each in registration order. */
export class MiddlewareInvoker {
	/** Middleware handled by this invoker node. */
	readonly middleware: Middleware;
	private __next?: MiddlewareInvoker;
	private __tail: MiddlewareInvoker = this;

	/**
	 * @param middleware Middleware handled by this invoker node.
	 */
	constructor(middleware: Middleware) {
		this.middleware = middleware;
	}

	/**
	 * Append a middleware to the end of the chain.
	 * @param middleware Middleware to add.
	 */
	next(middleware: Middleware) {
		const invoker = new MiddlewareInvoker(middleware);
		this.__tail.__next = invoker;
		this.__tail = invoker;
	}

	/**
	 * Invoke the given method across the whole middleware chain.
	 * @param method Name of the middleware method to call (e.g. "start", "navigate").
	 * @param context Invocation context.
	 * @returns Promise resolved when the chain has completed.
	 */
	invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<void> {
		return this.__exec(method, context);
	}

	private async __exec(method: string, context: InvokeContext): Promise<void> {
		let nextCalled = false;
		const nextFunc: MiddlewareNext = () => {
			if (nextCalled)
				throw new Error(`Middleware "${this.middleware.name}" called next() more than once for method "${method}".`);
			nextCalled = true;

			return this.__next ? this.__next.__exec(method, context) : Promise.resolve();
		};

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