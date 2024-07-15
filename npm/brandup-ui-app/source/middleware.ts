import { ApplicationModel } from "./typings/app";
import { Application } from "./app";

export class Middleware<TApp extends Application<TModel>, TModel extends ApplicationModel = {}> {
	private _app: TApp | null = null;

	get app(): TApp { return <TApp>this._app; }

	bind(app: TApp) {
		this._app = app;
	}

	start(context: StartContext, next: () => void, end: () => void) {
		next();
	}

	loaded(context: LoadContext, next: () => void, end: () => void) {
		next();
	}

	navigate(context: NavigateContext, next: () => void, end: () => void) {
		next();
	}

	submit(context: SubmitContext, next: () => void, end: () => void) {
		next();
	}

	stop(context: StopContext, next: () => void, end: () => void) {
		next();
	}
}

export interface StartContext extends InvokeContext {
}

export interface LoadContext extends InvokeContext {
}

export interface NavigateContext extends InvokeContext {
	readonly source: "nav" | "form";
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

export interface SubmitContext extends NavigateContext {
	readonly form: HTMLFormElement;
	readonly button: HTMLButtonElement | null;
	readonly method: string;
	readonly enctype: string;
}

export interface StopContext extends InvokeContext {
}

export interface InvokeContext {
	readonly context: { [key: string]: any };
	[key: string]: any;
}