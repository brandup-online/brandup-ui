export interface EnvironmentModel {
	basePath: string;
}

export interface ApplicationModel {
	[key: string]: any;
}

// navigation

export interface NavigationOptions {
	url?: string;
	query?: { [key: string]: string | string[] },
	replace?: boolean;
	context?: { [key: string]: any };
	callback?: (result: NavigationResult) => void;
}

export interface NavigationResult {
	status: NavigationStatus;
	context?: { [key: string]: any };
}

export type NavigationStatus = "Success" | "Cancelled" | "Error" | "External";

// submit

export interface SubmitOptions {
	form: HTMLFormElement;
	button?: HTMLButtonElement;
	context?: { [key: string]: any };
	callback?: (result: SubmitResult) => void;
}

export interface SubmitResult {
	context?: { [key: string]: any };
}