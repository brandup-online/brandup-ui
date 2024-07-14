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
	readonly url: string;
	readonly path: string;
	readonly query: string | null;
	readonly queryParams: { [key: string]: Array<string> };
	readonly hash: string | null;
	readonly replace: boolean;
	readonly context: { [key: string]: any };
}

export interface StopContext extends InvokeContext {
}

export interface SubmitContext extends InvokeContext {
	readonly form: HTMLFormElement;
	readonly button: HTMLButtonElement | null;
	readonly method: string;
	readonly enctype: string;
	readonly url: string;
	readonly context: { [key: string]: any };
}

export interface InvokeContext {
	readonly items: { [key: string]: any };
}