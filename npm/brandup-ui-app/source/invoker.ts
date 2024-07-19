import { Application } from "./app";
import { Middleware } from "./middleware";
import { ApplicationModel, InvokeContext } from "./typings/app";

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

	invoke<TContext extends InvokeContext>(method: string, context: TContext): Promise<TContext> {
		return new Promise<TContext>((resolve, reject) => {
			this.__invoke(method, context,
				() => resolve(context),
				(reason: any) => reject(reason || `Error middleware ${method} method execution.`));
		});
	}

	private __invoke<TContext extends InvokeContext>(method: string, context: TContext, success: VoidFunction, reject: (reason: any) => void) {
		const nextFunc = this.__next ? () => { this.__next?.__invoke(method, context, success, reject); } : success;
		const endFunc = () => { success(); };

		const methodFunc: (context: TContext, next?: VoidFunction, end?: VoidFunction, error?: (reason: any) => void) => void | Promise<boolean | any | void> = (<any>this.middleware)[method];

		if (typeof methodFunc === "function") {
			let methodResult: boolean | void | Promise<boolean | any | void>;

			try {
				methodResult = methodFunc.call(this.middleware, context, nextFunc, endFunc, reject);
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