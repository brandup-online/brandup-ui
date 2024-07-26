import { QueryParams } from "../types";
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
	readonly abort: AbortSignal;
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


export interface NavigateOptions<TData extends ContextData = ContextData> {
	url?: string | null;
	query?: QueryParams | URLSearchParams | FormData;
	replace?: boolean;
	data?: TData;
	abort?: AbortSignal;
}

export interface NavigateContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends InvokeContext {
	/** Index number of all application navigations. */
	readonly index: number;
	/** Source navigation event. */
	readonly source: NavigateSource;
	/** Application instance of navigation. */
	readonly app: TApplication;
	/** Previous navigation. */
	readonly current?: NavigateContext<TApplication, TData>;
	/** Parent navigation context. Specified if the navigation is nested. */
	readonly parent?: NavigateContext<TApplication, TData>;
	readonly overided: boolean;
	readonly data: TData;
	/** Origin, path and query, but without hash. */
	readonly url: string;
	/** Scheme, host and port. */
	readonly origin: string;
	/** Path and query, but without hash. */
	readonly pathAndQuery: string;
	/** Path of navigation url. */
	readonly path: string;
	/** Query parameters of navigation url. */
	readonly query: URLSearchParams;
	/** Hash of navigation url. */
	readonly hash: string | null;
	/** Navigation origin is different of current page origin. */
	readonly external: boolean;
	/** Replace current navigation entry. */
	replace: boolean;
	/** Redirect to new url and throw for end current context. */
	redirect(options?: NavigateOptions<TData> | string | null): Promise<NavigateContext<TApplication, TData>>;
}

/**
 * Navigation event source.
 * first - first navigation by application.
 * nav - from nav application method.
 * submit - from submit form.
 */
export type NavigateSource = "first" | "nav" | "submit";

// submit method

export interface SubmitOptions<TData extends ContextData = ContextData> {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	query?: QueryParams | URLSearchParams;
	data?: TData;
	abort?: AbortSignal;
}

export interface SubmitContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends NavigateContext<TApplication, TData> {
	readonly form: HTMLFormElement;
	readonly button: HTMLButtonElement | null;
	readonly method: SubmitMethod;
	readonly enctype: string;
}

export type SubmitMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;