export interface EnvironmentModel {
	basePath: string;
	[key: string]: any;
}

export interface ApplicationModel {
	[key: string]: any;
}

export interface InvokeContext {
	readonly data: ContextData;
}

// start? load and stop

export interface StartContext extends InvokeContext {
}

export interface StopContext extends InvokeContext {
}

// navigation

export interface NavigationOptions {
	url?: string | null;
	query?: QueryParams;
	replace?: boolean;
	context?: ContextData;
	callback?: (result: CallbackResult<NavigateContext>) => void | null;
}

export interface CallbackResult<TContext extends InvokeContext> {
	status: CallbackStatus;
	context: TContext;
}

export type CallbackStatus = "success" | "error";

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

// submit

export interface SubmitOptions {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	query?: QueryParams;
	context?: ContextData;
	callback?: (result: CallbackResult<SubmitContext>) => void
}

export interface SubmitContext extends NavigateContext {
	readonly form: HTMLFormElement;
	readonly button: HTMLButtonElement | null;
	readonly method: SubmitMethod;
	readonly enctype: string;
}

export type SubmitMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;

// common

export interface ContextData {
	[key: string]: any;
}

export interface QueryParams {
	[key: string]: string | string[];
}