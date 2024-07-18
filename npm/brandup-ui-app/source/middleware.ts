import { ApplicationModel, ContextData } from "./typings/app";
import { Application } from "./app";

export class Middleware<TApp extends Application<TModel>, TModel extends ApplicationModel = {}> {
	private _app: TApp | null = null;

	get app(): TApp { return <TApp>this._app; }

	bind(app: TApp) {
		this._app = app;
	}

	start(context: StartContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		next();
	}

	loaded(context: LoadContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		next();
	}

	navigate(context: NavigateContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		next();
	}

	submit(context: SubmitContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		next();
	}

	stop(context: StopContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
		next();
	}
}

export interface StartContext extends InvokeContext {
}

export interface LoadContext extends InvokeContext {
}

export interface NavigateContext extends InvokeContext {
	/** Source navigation event. */
	readonly source: NavigateSource;
	/** Full url for navigation. */
	readonly url: string;
	/** Scheme, host and port. */
	readonly origin: string;
	/** Path of navigation url. */
	readonly path: string;
	/** Query parameters of navigation url. */
	readonly query: URLSearchParams;
	/** Hash of navigation url. */
	readonly hash: string | null;
	/** Replace current navigation entry. */
	readonly replace: boolean;
	/** Navigation origin is different of current page origin. */
	readonly external: boolean;
}

/**
 * Navigation event source.
 * first - first navigation from run.
 * nav - from nav app method.
 * submit - from submit app method. For only get submit.
 */
export type NavigateSource = "first" | "nav" | "submit";

export interface SubmitContext extends NavigateContext {
	readonly form: HTMLFormElement;
	readonly button: HTMLButtonElement | null;
	readonly method: SubmitMethod;
	readonly enctype: string;
}

export type SubmitMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;

export interface StopContext extends InvokeContext {
}

export interface InvokeContext {
	readonly data: ContextData;
}