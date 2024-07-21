export interface EnvironmentModel {
	basePath: string;
	[key: string]: any;
}

export interface ApplicationModel {
	[key: string]: any;
}

export interface QueryParams {
	[key: string]: string | string[];
}