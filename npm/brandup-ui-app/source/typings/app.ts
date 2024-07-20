export interface EnvironmentModel {
	basePath: string;
	[key: string]: any;
}

export interface ApplicationModel {
	[key: string]: any;
}

// start? load and stop

export interface StartContext<TData extends ContextData = { [key: string]: any; }> extends InvokeContext<TData> {
}

export interface StopContext<TData extends ContextData = { [key: string]: any; }> extends InvokeContext<TData> {
}

// navigation

export interface NavigationOptions<TData extends ContextData = { [key: string]: any; }> {
	url?: string | null;
	query?: QueryParams | URLSearchParams | FormData;
	replace?: boolean;
	data?: TData;
	callback?: (result: CallbackResult<NavigateContext<TData>>) => void | null;
}

export interface CallbackResult<TContext extends InvokeContext<TData>, TData extends ContextData = { [key: string]: any; }> {
	status: CallbackStatus;
	context: TContext;
}

export type CallbackStatus = "success" | "error";

export interface NavigateContext<TData extends ContextData = { [key: string]: any; }> extends InvokeContext<TData> {
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

export interface SubmitOptions<TData extends ContextData = { [key: string]: any; }> {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	query?: QueryParams | URLSearchParams;
	data?: TData;
	callback?: (result: CallbackResult<SubmitContext<TData>>) => void;
}

export interface SubmitContext<TData extends ContextData = { [key: string]: any; }> extends NavigateContext<TData> {
	readonly form: HTMLFormElement;
	readonly button: HTMLButtonElement | null;
	readonly method: SubmitMethod;
	readonly enctype: string;
}

export type SubmitMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;

// common

export interface InvokeContext<TData extends ContextData = { [key: string]: any; }> {
	readonly data: TData;
}

export interface ContextData {
	[key: string]: any;
}

export interface QueryParams {
	[key: string]: string | string[];
}