export interface EnvironmentModel {
	basePath: string;
	[key: string]: any;
}

export interface ApplicationModel {
	[key: string]: any;
}

// navigation

export interface NavigationOptions {
	url?: string | null;
	query?: QueryParams;
	replace?: boolean;
	context?: ContextData;
	callback?: (result: CallbackResult) => void | null;
}

export interface CallbackResult {
	status: CallbackStatus;
	context: ContextData;
}

export type CallbackStatus = "Success" | "Error";

// submit

export interface SubmitOptions {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	query?: QueryParams;
	context?: ContextData;
	callback?: (result: CallbackResult) => void
}

// common

export interface ContextData {
	[key: string]: any;
}

export interface QueryParams {
	[key: string]: string | string[];
}