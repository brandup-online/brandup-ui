import { QueryParams } from "../types";
import { Application } from "../app";

/** Application middleware injecting into lifecycle events. */
export interface Middleware {
	/** Unique name of the middleware. */
	readonly name: string;
	/** Called when the application starts. */
	start?: MiddlewareMethod;
	/** Called after the application is loaded. */
	loaded?: MiddlewareMethod;
	/** Called on each navigation. */
	navigate?: MiddlewareMethod;
	/** Called on each form submit. */
	submit?: MiddlewareMethod;
	/** Called when the application is destroyed. */
	stop?: MiddlewareMethod;
	/** Custom middleware methods. */
	[key: string]: MiddlewareMethod | any;
}

/**
 * A middleware lifecycle method.
 * @param context Invocation context.
 * @param next Callback that runs the next middleware in the chain.
 */
export type MiddlewareMethod<TContext extends InvokeContext = any> = (context: TContext, next: MiddlewareNext) => Promise<void>;

/** Runs the next middleware in the chain. */
export type MiddlewareNext = () => Promise<void>;

/** Base context passed to every middleware method. */
export interface InvokeContext {
	/** Application instance. */
	readonly app: Application;
	/** Context data shared across the middleware chain. */
	readonly data: ContextData;
	/** Abort signal for the current operation. */
	readonly abort: AbortSignal;
}

/** Arbitrary data carried through a middleware invocation. */
export interface ContextData {
	[key: string]: any;
}

// start and load methods

/** Context for the `start` and `loaded` middleware methods. */
export interface StartContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends InvokeContext {
	/** Application instance. */
	readonly app: TApplication;
	/** Start context data. */
	readonly data: TData;
}

// stop method

/** Context for the `stop` middleware method. */
export interface StopContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends InvokeContext {
	/** Application instance. */
	readonly app: TApplication;
	/** Stop context data. */
	readonly data: TData;
}

// navigate method


/** Options for an application navigation. */
export interface NavigateOptions<TData extends ContextData = ContextData> {
	/** Target url. Relative urls are resolved against the application base path. */
	url?: string | null;
	/** Query parameters to add or replace on the target url. */
	query?: QueryParams | URLSearchParams | FormData;
	/** Replace the current history entry instead of pushing a new one. */
	replace?: boolean;
	/** Navigation scope. */
	scope?: string | null;
	/** Navigation context data. */
	data?: TData;
	/** External abort signal to cancel the navigation. */
	abort?: AbortSignal;
}

/** Context for the `navigate` middleware method. */
export interface NavigateContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends InvokeContext {
	/** Index number of all application navigations. */
	readonly index: number;
	/** Unique identifier of this navigation. */
	readonly id: string;
	/** Source navigation event. */
	readonly source: NavigateSource;
	/** Application instance of navigation. */
	readonly app: TApplication;
	/** Previous navigation. */
	readonly current?: NavigateContext<TApplication, TData>;
	/** Parent navigation context. Specified if the navigation is nested. */
	readonly parent?: NavigateContext<TApplication, TData>;
	/** True if this navigation was overridden by a newer one (e.g. a redirect). */
	readonly overided: boolean;
	/** Kind of navigation relative to the current url. */
	readonly action: NavigateAction;
	/** Navigation context data. */
	readonly data: TData;
	/** Origin, path and query, but without hash. */
	readonly url: string;
	/** Scheme, host and port. */
	readonly origin: string;
	/** Base path, path and query, but without hash. */
	readonly pathAndQuery: string;
	/** Base path. */
	readonly basePath: string;
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
	/** Navigation scope. */
	scope?: string | null;
	/**
	 * Redirect to a new url and throw to end the current context.
	 * Always throws {@link NAV_OVERIDE_ERROR}.
	 * @param options Navigate options or target url.
	 * @returns Promise of the redirected navigation context.
	 */
	redirect(options?: NavigateOptions<TData> | string | null): Promise<NavigateContext<TApplication, TData>>;
}

/**
 * Navigation event source.
 * first - first navigation by application.
 * nav - from nav application method.
 * submit - from submit form.
 */
export type NavigateSource = "first" | "nav" | "submit";

/**
 * Kind of navigation relative to the current url.
 * first - first navigation by application.
 * url-change - the url path or query changed.
 * url-no-change - the url did not change.
 * hash - only the hash changed.
 * submit - navigation triggered by a form submit.
 */
export type NavigateAction = "first" | "url-change" | "url-no-change" | "hash" | "submit";

// submit method

/** Options for a form submit. */
export interface SubmitOptions<TData extends ContextData = ContextData> {
	/** Form being submitted. */
	form: HTMLFormElement;
	/** Submit button that triggered the submit, if any. */
	button?: HTMLButtonElement | null;
	/** Query parameters to add or replace on the action url. */
	query?: QueryParams | URLSearchParams;
	/** Submit context data. */
	data?: TData;
	/** External abort signal to cancel the submit. */
	abort?: AbortSignal;
}

/** Context for the `submit` middleware method. Extends the navigation context. */
export interface SubmitContext<TApplication extends Application = Application, TData extends ContextData = ContextData> extends NavigateContext<TApplication, TData> {
	/** Submitted form element. */
	readonly form: HTMLFormElement;
	/** Submit button that triggered the submit, if any. */
	readonly button: HTMLButtonElement | null;
	/** HTTP method of the submit (upper-cased). */
	readonly method: SubmitMethod;
	/** Form encoding type. */
	readonly enctype: string;
}

/** HTTP method used for a form submit. */
export type SubmitMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;