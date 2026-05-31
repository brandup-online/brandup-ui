/** Runtime environment of the application. */
export interface EnvironmentModel {
	/** Base path prefix for all application urls. */
	basePath: string;
	/** Additional environment values. */
	[key: string]: any;
}

/** Application model carrying application-specific data. */
export interface ApplicationModel {
	/** Arbitrary model values. */
	[key: string]: any;
}

/** Query parameters as a plain object; values may be single or multiple. */
export interface QueryParams {
	[key: string]: string | string[];
}