import { ApplicationModel, StartContext, NavigateContext, SubmitContext, StopContext } from "./typings/app";
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

	loaded(context: StartContext, next: VoidFunction, end: VoidFunction, error: (reason: any) => void) {
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