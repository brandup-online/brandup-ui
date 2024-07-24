export type AJAXMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;
export type AJAXReqestType = "NONE" | "JSON" | "XML" | "FORM" | "FORMDATA" | "TEXT" | "BLOB";
export type ResponseType = "none" | "json" | "blob" | "text" | "html";

export type ResponseDelegate = (response: AjaxResponse) => void;
export type ErrorDelegate = (request: AjaxRequest, reason?: any) => void;

export type QueryData = { [key: string]: string | string[] };

export interface AjaxRequest<TState = any> {
	url?: string | null;
	query?: QueryData | null;
	method?: AJAXMethod | null;
	timeout?: number | null;
	headers?: { [key: string]: string } | null;
	type?: AJAXReqestType | null;
	data?: string | object | Blob | FormData | HTMLFormElement | null;
	abort?: AbortSignal;
	success?: ResponseDelegate | null;
	error?: ErrorDelegate | null;
	disableCache?: boolean | null;
	state?: TState | null;
}

export interface AjaxResponse<TData = any, TState = any> {
	status: number;
	redirected: boolean;
	url: string | null;
	type: ResponseType;
	contentType: string | null;
	headers: ResponseHeaders;
	data: TData | null;
	state?: TState | null;
}

export interface ResponseHeaders {
	get(name: string): string | null;
	has(name: string): boolean;
	forEach(callbackfn: (value: string, key: string, parent: ResponseHeaders) => void, thisArg?: any): void;
}