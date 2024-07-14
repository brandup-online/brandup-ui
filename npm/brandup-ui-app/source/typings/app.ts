export interface EnvironmentModel {
	basePath: string;
}

export interface ApplicationModel {
	[key: string]: any;
}

// navigation

export interface NavigationOptions {
	url?: string | null;
	query?: { [key: string]: string | string[] } | null,
	replace?: boolean;
	context?: { [key: string]: any } | null;
	callback?: (result: NavigationResult) => void | null;
}

export interface NavigationResult {
	status: NavigationStatus;
	context: { [key: string]: any } | null;
}

export type NavigationStatus = "Success" | "Cancelled" | "Error" | "External";

// submit

export interface SubmitOptions {
	form: HTMLFormElement;
	button?: HTMLButtonElement | null;
	context?: { [key: string]: any } | null;
	callback?: (result: SubmitResult) => void | null
}

export interface SubmitResult {
	context: { [key: string]: any } | null;
}