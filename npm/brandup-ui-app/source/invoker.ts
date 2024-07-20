import { Application } from "./app";
import { Middleware, MiddlewareNext } from "./middleware";
import { InvokeContext } from "./typings/app";

export class MiddlewareInvoker {
	readonly middleware: Middleware<Application>;
	private __next: MiddlewareInvoker | null = null;

	constructor(middleware: Middleware<Application>) {
		this.middleware = middleware;
	}

	next(middleware: Middleware<Application>) {
		if (this.__next)
			this.__next.next(middleware);
		else
			this.__next = new MiddlewareInvoker(middleware);
	}

	async invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<TContext> {
		try {
			await this.__invoke(method, context);
		}
		catch (e) {
			console.error(`Error middleware "${method}" execution: ${e}`);

			throw e;
		}

		return context;
	}

	private async __invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<void> {
		const nextFunc: MiddlewareNext = () => { return this.__next ? this.__next.__invoke(method, context) : Promise.resolve(); };

		const methodFunc: (context: TContext, next: MiddlewareNext) => Promise<void> = (<any>this.middleware)[method];
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