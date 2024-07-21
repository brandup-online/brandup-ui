import { Middleware, MiddlewareMethod, MiddlewareNext, InvokeContext } from "./base";

export class MiddlewareInvoker {
	readonly middleware: Middleware;
	private __next: MiddlewareInvoker | null = null;

	constructor(middleware: Middleware) {
		this.middleware = middleware;
	}

	next(middleware: Middleware) {
		if (this.__next)
			this.__next.next(middleware);
		else
			this.__next = new MiddlewareInvoker(middleware);
	}

	async invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<void> {
		try {
			await this.__invoke(method, context);
		}
		catch (e) {
			console.error(`Error middleware "${method}" execution: ${e}`);

			throw e;
		}
	}

	private async __invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<void> {
		const nextFunc: MiddlewareNext = () => { return this.__next ? this.__next.__invoke(method, context) : Promise.resolve(); };

		const methodFunc: MiddlewareMethod = this.middleware[method];
		if (typeof methodFunc === "function") {
			const methodResult: Promise<void> = methodFunc.call(this.middleware, context, nextFunc);

			if (!methodResult || !(methodResult instanceof Promise))
				throw new Error(`Middleware method "${method}" is not async.`);

			await methodResult;
		}
		else
			await nextFunc();
	}
}