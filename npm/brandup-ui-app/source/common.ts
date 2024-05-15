export interface EnvironmentModel {
    basePath: string;
}

export interface ApplicationModel {
    [key: string]: any;
}

export interface NavigationOptions {
    url: string;
    replace?: boolean;
    context?: { [key: string]: any };
    callback?: (result: NavigationResult) => void;
}

export enum NavigationStatus {
    Success = 1,
    Cancelled = 2,
    Error = 3,
    External = 4
}

export interface NavigationResult {
    status: NavigationStatus;
    context?: { [key: string]: any };
}

export interface SubmitOptions {
    form: HTMLFormElement;
    button: HTMLButtonElement;
    context?: { [key: string]: any };
    callback?: (result: SubmitResult) => void;
}

export interface SubmitResult {
    context?: { [key: string]: any };
}