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
	context?: { [key: string]: any };
	callback?: (result: CallbackResult) => void | null;
}

export interface CallbackResult {
	status: CallbackStatus;
	context: { [key: string]: any } | null;
}

export type CallbackStatus = "Success" | "Error";

// submit

export interface SubmitOptions {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	query?: QueryParams;
	context?: { [key: string]: any };
	callback?: (result: CallbackResult) => void
}

// common

export interface QueryParams {
	[key: string]: string | string[];
}