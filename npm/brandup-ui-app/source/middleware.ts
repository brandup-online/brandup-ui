import { ApplicationModel } from "./common";
import { Application } from "./app";

export class Middleware<TModel extends ApplicationModel = {}> {
    private _app: Application<TModel>;

    get app(): Application<TModel> { return this._app; }

    bind(app: Application<TModel>) {
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
    readonly query: string;
    readonly queryParams: { [key: string]: Array<string> };
    readonly hash: string;
    readonly replace: boolean;
    readonly context: { [key: string]: any };
}

export interface StopContext extends InvokeContext {
}

export interface SubmitContext extends InvokeContext {
    readonly form: HTMLFormElement;
    readonly button: HTMLButtonElement;
    readonly method: string;
    readonly enctype: string;
    readonly url: string;
    readonly context: { [key: string]: any };
}

export interface InvokeContext {
    readonly items: { [key: string]: any };
}