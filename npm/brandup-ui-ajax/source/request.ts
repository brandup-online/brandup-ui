export type AJAXMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | string;
export type AJAXReqestType = "NONE" | "JSON" | "XML" | "FORM" | "FORMDATA" | "TEXT" | "BLOB";
export type ResponseTye = "none" | "json" | "blob" | "text" | "html";

export type ResponseDelegate = (response: AjaxResponse) => void;
export type ErrorDelegate = (request: AjaxRequest, reason?: any) => void;

const DEFAULT_TIMEOUT = 30000;
const FORM_URL = "application/x-www-form-urlencoded";
const FORM_DATA = "multipart/form-data";

export type QueryData = { [key: string]: string | string[] };

export interface AjaxRequest<TState = any> {
	url?: string | null;
	query?: QueryData | null;
	method?: AJAXMethod | null;
	timeout?: number | null;
	headers?: { [key: string]: string } | null;
	type?: AJAXReqestType | null;
	data?: string | object | Blob | FormData | HTMLFormElement | null;
	success?: ResponseDelegate | null;
	error?: ErrorDelegate | null;
	disableCache?: boolean | null;
	state?: TState | null;
}

export interface AjaxResponse<TData = any, TState = any> {
	status: number;
	redirected: boolean;
	url: string | null;
	type: ResponseTye;
	contentType: string | null;
	data: TData | null;
	state?: TState | null;
}

export const urlEncode = (data: string, rfc3986 = true) => {
	data = encodeURIComponent(data);
	data = data.replace(/%20/g, '+');

	if (rfc3986) {
		data = data.replace(/[!'()*]/g, function (c) {
			return '%' + c.charCodeAt(0).toString(16);
		});
	}

	return data;
}

export const ajaxRequest = (options: AjaxRequest) => {
	let url = options.url || location.href;
	let { query } = options;

	if (options.disableCache) {
		if (!query) query = {};
		query["_"] = new Date().getTime().toString();
	}

	url = extendUrl(url, query);

	const method = options.method ? options.method : "GET";

	if (options.data && method === "GET")
		throw new Error("GET method is not support request with data.");

	detectRequestType(options);
	const prepared = prepareRequest(options, options.data);

	const xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	if (options.timeout === 0 || options.timeout)
		xhr.timeout = options.timeout;

	xhr.onreadystatechange = (e: Event) => {
		switch (xhr.readyState) {
			case XMLHttpRequest.DONE: {
				if (options.success) {
					let responseData: any = null;
					let responseType: ResponseTye = "none";

					const contentType = xhr.getResponseHeader("Content-Type");
					if (xhr.response) {
						if (contentType) {
							if (contentType.includes("json")) {
								responseType = "json";
								responseData = JSON.parse(xhr.responseText);
							}
							else if (contentType.includes("text/plain")) {
								responseType = "text";
								responseData = xhr.responseText;
							}
							else if (contentType.includes("text/html")) {
								responseType = "html";
								responseData = xhr.responseText;
							}
						}
					}

					options.success({
						status: xhr.status,
						url: xhr.responseURL,
						redirected: false,
						type: responseType,
						contentType,
						data: responseData,
						state: options.state
					});
				}
				break;
			}
		}
	};

	xhr.onabort = (e: ProgressEvent) => {
		if (options.error)
			options.error(options, "Request aborted");
	}

	xhr.open(method, url, true);
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

	for (const key in prepared.headers) {
		const value = prepared.headers[key];
		if (!value)
			continue;
		xhr.setRequestHeader(key, value);
	}

	if (method === "GET")
		xhr.send();
	else
		xhr.send(prepared.body);

	return xhr;
}

export const request = async (options: AjaxRequest, abortSignal?: AbortSignal): Promise<AjaxResponse> => {
	let url = options.url || location.href;
	url = extendUrl(url, options.query);

	const method = options.method ? options.method.toUpperCase() : "GET";

	let body: any = options.data;
	if (body && method === "GET")
		throw new Error("GET method is not support request with data.");

	detectRequestType(options);
	const prepared = prepareRequest(options, body);

	const abortSignals = [AbortSignal.timeout(options.timeout ?? DEFAULT_TIMEOUT)];
	if (abortSignal)
		abortSignals.push(abortSignal);

	try {
		const response = await fetch(url, {
			method,
			headers: prepared.headers,
			cache: options.disableCache ? "no-cache" : "default",
			redirect: "follow",
			signal: AbortSignal.any(abortSignals),
			body: prepared.body
		});

		let result: AjaxResponse;

		switch (response.type) {
			case "basic":
			case "default": {
				let responseData: any = null;
				let responseType: ResponseTye = "none";

				const contentType = response.headers.get("content-type");
				if (!response.redirected && response.body) {
					if (contentType) {
						if (contentType.includes("json")) {
							responseType = "json";
							responseData = await response.json();
						}
						else if (contentType.includes("text/html")) {
							responseType = "html";
							responseData = await response.text();
						}
						else if (contentType.includes("text/plain")) {
							responseType = "text";
							responseData = await response.text();
						}
						else {
							responseType = "blob";
							responseData = await response.blob();
						}
					}
				}

				result = {
					status: response.status,
					url: response.url,
					redirected: response.redirected,
					type: responseType,
					contentType,
					data: responseData,
					state: options.state
				};

				break;
			}
			case "opaqueredirect":
				throw new Error("Not supported opaqueredirect.")
			case "error":
				throw new Error("Response error.");
			case "cors":
				throw new Error("Response type cors is not supported.");
			case "opaque":
				throw new Error("Response type opaque is not supported.");
			default:
				throw new Error(`Unknown response type: ${response.type}`);
		}

		if (options.success)
			options.success(result);

		return result;
	}
	catch (error: any) {
		if (options.error)
			options.error(options, error);

		throw new Error(`Error ajax request: ${(error && error.message) ? error.message : error}`);
	}
}

const detectRequestType = (options: AjaxRequest) => {
	if (!options.type && options.data) {
		const body = options.data;
		if (body instanceof Blob)
			options.type = "BLOB";
		else if (body instanceof FormData)
			options.type = null;
		else if (body instanceof HTMLFormElement)
			options.type = "FORM";
		else if (body instanceof Object)
			options.type = "JSON";
		else if (typeof body === "string")
			options.type = "TEXT";
	}
}

const prepareRequest = (options: AjaxRequest, body: any): { headers: Record<string, string>, body: any } => {
	const headers: Record<string, string> = {};

	if (options.headers) {
		for (const key in options.headers) {
			const value = options.headers[key];
			if (!value)
				continue;

			headers[key] = value;
		}
	}

	if (options.type) {
		let contentType: string | null = null;
		let accept: string | null = null;

		switch (options.type) {
			case "XML":
				contentType = "application/xml; charset=utf-8";
				accept = "application/xml, text/xml, */*; q=0.01";
				break;
			case "JSON":
				contentType = "application/json; charset=utf-8";
				accept = "application/json, text/json, */*; q=0.01";

				body = JSON.stringify(body);

				break;
			case "FORM":
				if (body instanceof HTMLFormElement) {
					//const form = <HTMLFormElement>body;
					//contentType = form.enctype ?? FORM_URL;
					body = new FormData(body);
				}
				else if (body instanceof FormData)
					contentType = FORM_URL;

				if (contentType == FORM_URL)
					body = encodeForm(body);
				else if (contentType == FORM_DATA)
					contentType = null;

				break;
			case "FORMDATA":
				break;
			case "TEXT":
				contentType = "text/plain";
				break;
			case "BLOB":
				break;
		}

		if (accept)
			headers["Accept"] = accept;
		if (contentType)
			headers['Content-Type'] = contentType;
	}

	return {
		headers,
		body
	};
}

const createSearchParams = (query?: QueryData | null) => {
	const urlParams = new URLSearchParams();

	if (!query)
		return urlParams;

	for (const key in query) {
		const val = query[key];
		if (val === null)
			continue;

		if (Array.isArray(val))
			val.forEach(v => urlParams.append(key, v));
		else
			urlParams.append(key, val);
	}

	return urlParams;
}

const extendUrl = (url: string, query?: QueryData | null) => {
	if (query) {
		const urlParams = createSearchParams(query);

		if (urlParams.size) {
			if (url.indexOf("?") === -1)
				url += "?";
			else
				url += "&";

			url += urlParams.toString();
		}
	}

	return url;
}

const encodeForm = (data: FormData) => {
	const query = new URLSearchParams();

	data.forEach((value: FormDataEntryValue, key: string) => {
		if (!key)
			return;
		query.append(key, value.toString());
	});

	return query.toString();
}