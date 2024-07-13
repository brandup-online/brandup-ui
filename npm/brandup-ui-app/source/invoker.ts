import { Application } from "./app";
import { Middleware, InvokeContext } from "./middleware";
import { ApplicationModel } from "./typings/app";

export class MiddlewareInvoker {
	readonly middleware: Middleware<Application, ApplicationModel>;
	private __next: MiddlewareInvoker;
	private static emptyFunc = () => { return; };

	constructor(middleware: Middleware<Application, ApplicationModel>) {
		this.middleware = middleware;
	}

	next(middleware: Middleware<Application, ApplicationModel>) {
		if (this.__next) {
			this.__next.next(middleware);
			return;
		}

		this.__next = new MiddlewareInvoker(middleware);
	}

	invoke<TContext extends InvokeContext>(method: string, context: TContext, callback?: () => void) {
		if (!callback)
			callback = MiddlewareInvoker.emptyFunc;

		const nextFunc = this.__next ? () => { this.__next.invoke(method, context, callback); } : callback;
		const endFunc = () => { callback(); };

		if (typeof this.middleware[method] === "function")
			this.middleware[method](context, nextFunc, endFunc);
		else
			nextFunc();
	}
}