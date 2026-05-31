/** HTTP method for an AJAX request. Common verbs are suggested, but any custom string is allowed. */
export type AJAXMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | string;
/** Request body kind. Controls the `Content-Type`/`Accept` headers and how `data` is serialized. When omitted it is auto-detected from `data`. */
export type AJAXReqestType = "NONE" | "JSON" | "XML" | "FORM" | "FORMDATA" | "TEXT" | "BLOB";
/** Resolved kind of the response body, derived from the response `Content-Type`. `"blob"` only occurs for the fetch-based {@link request}; `ajaxRequest` (XHR) never returns blob. */
export type ResponseType = "none" | "json" | "blob" | "text" | "html";

/** Callback invoked with the parsed response on success. */
export type ResponseDelegate = (response: AjaxResponse) => void;
/** Callback invoked when a request fails or is aborted. `reason` is the thrown error or an abort/timeout message. */
export type ErrorDelegate = (request: AjaxRequest, reason?: any) => void;

/** Query string parameters. Each value may be a single string or an array (repeated key). */
export type QueryData = { [key: string]: string | string[] };

/** Options describing an AJAX request. */
export interface AjaxRequest<TState = any> {
	/** Target URL. Defaults to the current `location.href` when omitted. */
	url?: string | null;
	/** Query string parameters appended to the URL. */
	query?: QueryData | null;
	/** HTTP method. Defaults to `"GET"`; normalized to upper-case. */
	method?: AJAXMethod | null;
	/** Fetch request mode (e.g. `"cors"`). Only honored by the fetch-based {@link request}. */
	mode?: RequestMode;
	/** Fetch credentials policy. Defaults to `"include"` in {@link request}; XHR always sends credentials. */
	credentials?: RequestCredentials;
	/** Timeout in milliseconds. {@link request} defaults to 30000 ms when omitted; `0` disables the XHR timeout. */
	timeout?: number | null;
	/** Additional request headers. Entries with empty values are skipped. */
	headers?: { [key: string]: string } | null;
	/** Body serialization kind. Auto-detected from `data` when omitted. */
	type?: AJAXReqestType | null;
	/** Request body. Not allowed for `GET` (and `HEAD` in {@link request}). */
	data?: string | object | Blob | FormData | HTMLFormElement | null;
	/** Signal used to abort the request. */
	abort?: AbortSignal;
	/** Called with the response on success. */
	success?: ResponseDelegate | null;
	/** Called on failure, abort or timeout. */
	error?: ErrorDelegate | null;
	/** When `true`, bypasses caching. {@link request} sends `cache: "no-store"`; `ajaxRequest` appends a `_=<timestamp>` cache-busting query param. */
	disableCache?: boolean | null;
	/** Arbitrary state passed through to the response unchanged. */
	state?: TState | null;
}

/** Parsed result of an AJAX request. */
export interface AjaxResponse<TData = any, TState = any> {
	/** HTTP status code. */
	status: number;
	/** Whether the request was redirected. Always `false` for `ajaxRequest` (XHR). */
	redirected: boolean;
	/** Final response URL. */
	url: string | null;
	/** Resolved body kind derived from the response `Content-Type`. */
	type: ResponseType;
	/** Raw `Content-Type` header value. */
	contentType: string | null;
	/** Accessor over the response headers. */
	headers: ResponseHeaders;
	/** Parsed response body, or `null` when there is no body. */
	data: TData | null;
	/** State value carried over from the originating request. */
	state?: TState | null;
}

/** Read-only accessor over response headers, mirroring a subset of the Fetch `Headers` API. */
export interface ResponseHeaders {
	/** Returns the value of the given header, or `null` if absent. */
	get(name: string): string | null;
	/** Returns whether the given header is present. */
	has(name: string): boolean;
	/** Iterates over each header value/name pair. */
	forEach(callbackfn: (value: string, key: string, parent: ResponseHeaders) => void, thisArg?: any): void;
}