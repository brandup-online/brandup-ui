import { Application } from "../app";

export interface Middleware {
	readonly name: string;
	start?: MiddlewareMethod;
	loaded?: MiddlewareMethod;
	navigate?: MiddlewareMethod;
	submit?: MiddlewareMethod;
	stop?: MiddlewareMethod;
	[key: string]: MiddlewareMethod | any;
}

export type MiddlewareMethod<TContext extends InvokeContext = any> = (context: TContext, next: MiddlewareNext) => Promise<void>;

export type MiddlewareNext = () => Promise<void>;

export interface InvokeContext {
	readonly app: Application;
	readonly data: ContextData;
}

export interface ContextData {
	[key: string]: any;
}

// start and load methods

export interface StartContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends InvokeContext {
	readonly app: TApplication;
	readonly data: TData;
}

// stop method

export interface StopContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends InvokeContext {
	readonly app: TApplication;
	readonly data: TData;
}

// navigate method

export interface NavigateContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends InvokeContext {
	readonly app: TApplication;
	readonly data: TData;
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
	/** Navigation origin is different of current page origin. */
	readonly external: boolean;
	replace: boolean;
}

/**
 * Navigation event source.
 * first - first navigation from run.
 * nav - from nav app method.
 * submit - from submit app method. For only get submit.
 */
export type NavigateSource = "first" | "nav" | "submit";

// submit method

export interface SubmitContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends NavigateContext<TApplication, TData> {
	readonly form: HTMLFormElement;
	readonly button: HTMLButtonElement | null;
	readonly method: SubmitMethod;
	readonly enctype: string;
}

export type SubmitMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;