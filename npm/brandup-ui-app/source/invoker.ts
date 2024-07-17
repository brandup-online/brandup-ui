import { Application } from "./app";
import { Middleware, InvokeContext } from "./middleware";
import { ApplicationModel, ContextData } from "./typings/app";

export class MiddlewareInvoker {
	readonly middleware: Middleware<Application, ApplicationModel>;
	private __next: MiddlewareInvoker | null = null;

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
			this.__invoke(method, context,
				() => resolve(context.data),
				(reason: any) => reject(reason || `Error middleware ${method} method execution.`));
		});
	}

	private __invoke<TContext extends InvokeContext>(method: string, context: TContext, success: () => void, reject: (reason: any) => void) {
		const nextFunc = this.__next ? () => { this.__next?.__invoke(method, context, success, reject); } : success;
		const endFunc = () => { success(); };

		if (typeof this.middleware[method] === "function") {
			let methodResult: any;

			try {
				methodResult = this.middleware[method](context, nextFunc, endFunc, reject);
			}
			catch (e) {
				reject(e);
				return;
			}

			if (methodResult && methodResult instanceof Promise) {
				// Middleware method is async

				const resultPromise = <Promise<boolean>>methodResult;
				resultPromise
					.then(isNext => (isNext === undefined || isNext) ? nextFunc() : endFunc())
					.catch(reason => reject(reason));
			}
		}
		else
			nextFunc();
	}
}