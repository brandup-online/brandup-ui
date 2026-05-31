import { AjaxRequest, ResponseType, ResponseHeaders } from "./types";
import * as helpers from "./helpers";
import internals from "./internals";

/**
 * Performs an AJAX request using `XMLHttpRequest`, always with credentials.
 *
 * The response body is parsed by `Content-Type` into JSON, `text/plain` or `text/html`;
 * unlike the fetch-based {@link request}, there is no `blob` response type. `disableCache`
 * appends a `_=<timestamp>` cache-busting query parameter (rather than `cache: "no-store"`).
 * Results and errors are delivered through `options.success` / `options.error`; this
 * function does not return a promise.
 *
 * @param options Request options. `GET` requests must not carry `data`. `timeout` of `0` disables the timeout.
 * @returns The underlying `XMLHttpRequest`, which can be used to `abort()` the request.
 */
export const ajaxRequest = (options: AjaxRequest) => {
	let url = options.url || location.href;
	let { query } = options;

	if (options.disableCache) {
		if (!query) query = {};
		query["_"] = Date.now().toString();
	}

	url = helpers.addQuery(url, query);

	const method = options.method ? options.method.toUpperCase() : "GET";

	if (options.data && (method === "GET" || method === "HEAD"))
		throw new Error(`${method} method does not support a request body.`);

	internals.detectRequestType(options);
	const prepared = internals.prepareRequest(options, options.data);

	const xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	if (options.timeout === 0 || options.timeout)
		xhr.timeout = options.timeout;

	xhr.onreadystatechange = (_e: Event) => {
		if (xhr.readyState !== XMLHttpRequest.DONE)
			return;

		if (options.success) {
			let responseData: any = null;
			let responseType: ResponseType = "none";

			const contentType = xhr.getResponseHeader("Content-Type");
			if (xhr.response && contentType) {
				if (contentType.includes("json")) {
					responseType = "json";
					try {
						responseData = JSON.parse(xhr.responseText);
					}
					catch (e) {
						if (options.error)
							options.error(options, e);
						return;
					}
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

			const xhrRef = xhr;
			const headers: ResponseHeaders = {
				get(name: string): string | null {
					return xhrRef.getResponseHeader(name);
				},
				has(name: string): boolean {
					return !!xhrRef.getResponseHeader(name);
				},
				forEach(callbackfn: (value: string, key: string, parent: ResponseHeaders) => void, thisArg?: any): void {
					xhrRef.getAllResponseHeaders()
						.trim()
						.split(/[\r\n]+/)
						.filter(Boolean)
						.forEach(line => {
							const idx = line.indexOf(": ");
							const key = idx >= 0 ? line.substring(0, idx).toLowerCase() : line.toLowerCase();
							const value = idx >= 0 ? line.substring(idx + 2) : "";
							callbackfn.call(thisArg, value, key, <ResponseHeaders>{});
						});
				}
			};

			options.success({
				status: xhr.status,
				url: xhr.responseURL,
				redirected: false,
				type: responseType,
				contentType,
				headers,
				data: responseData,
				state: options.state
			});
		}
	};

	xhr.onabort = (_e: ProgressEvent) => {
		if (options.error)
			options.error(options, "Request aborted");
	}

	xhr.onerror = (_e: ProgressEvent) => {
		if (options.error)
			options.error(options, "Request network error");
	}

	xhr.ontimeout = (_e: ProgressEvent) => {
		if (options.error)
			options.error(options, "Request timeout");
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