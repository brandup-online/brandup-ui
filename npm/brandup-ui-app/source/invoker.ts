import { Application } from "./app";
import { Middleware, InvokeContext } from "./middleware";
import { ApplicationModel, ContextData } from "./typings/app";

export class MiddlewareInvoker {
	readonly middleware: Middleware<Application, ApplicationModel>;
	private __next: MiddlewareInvoker | null = null;
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

	invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<ContextData> {
		return new Promise<ContextData>((resolve, reject) => {
			const success = () => { resolve(context.data); }
			const error = (reason: any) => { reject(reason || `Error invoke middleware method ${method}`); };

			this.__invoke(method, context, success, error);
		});
	}

	private __invoke<TContext extends InvokeContext>(method: string, context: TContext, success: () => void, reject: (reason: any) => void) {
		const nextFunc = this.__next ? () => { this.__next?.__invoke(method, context, success, reject); } : success;
		const endFunc = () => { success(); };
		const errorFunc = (reason: any) => { reject(reason); };

		if (typeof this.middleware[method] === "function") {
			try {
				this.middleware[method](context, nextFunc, endFunc, errorFunc);
			}
			catch (e) {
				reject(e);
			}
		}
		else
			nextFunc();
	}
}