import { ApplicationModel, StartContext, NavigateContext, SubmitContext, StopContext } from "./typings/app";
import { Application } from "./app";

export class Middleware<TApp extends Application<TModel>, TModel extends ApplicationModel = {}> {
	private _app: TApp | null = null;

	get app(): TApp { return <TApp>this._app; }

	initialize(app: TApp) {
		this._app = app;
	}
}

export type MiddlewareNext = () => Promise<void>;