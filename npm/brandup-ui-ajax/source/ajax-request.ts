import { AjaxRequest, ResponseType, ResponseHeaders } from "./types";
import * as helpers from "./helpers";
import internals from "./internals";

/** Request with XMLHttpRequest. */
export const ajaxRequest = (options: AjaxRequest) => {
	let url = options.url || location.href;
	let { query } = options;

	if (options.disableCache) {
		if (!query) query = {};
		query["_"] = new Date().getTime().toString();
	}

	url = helpers.addQuery(url, query);

	const method = options.method ? options.method : "GET";

	if (options.data && method === "GET")
		throw new Error("GET method is not support request with data.");

	internals.detectRequestType(options);
	const prepared = internals.prepareRequest(options, options.data);

	const xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	if (options.timeout === 0 || options.timeout)
		xhr.timeout = options.timeout;

	xhr.onreadystatechange = (_e: Event) => {
		switch (xhr.readyState) {
			case XMLHttpRequest.DONE: {
				if (options.success) {
					let responseData: any = null;
					let responseType: ResponseType = "none";

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

					const headers: ResponseHeaders = {
						get(name: string): string | null {
							return xhr.getResponseHeader(name);
						},
						has(name: string): boolean {
							return !!xhr.getResponseHeader(name);
						},
						forEach(callbackfn: (value: string, key: string, parent: ResponseHeaders) => void, thisArg?: any): void {
							const headers = xhr.getAllResponseHeaders();

							// Convert the header string into an array
							// of individual headers
							const arr = headers.trim().split(/[\r\n]+/);

							// Create a map of header names to values
							arr.forEach((line) => {
								const parts = line.split(": ");
								const header = parts.shift() || "";
								const value = parts.join(": ");

								callbackfn.call(thisArg, value, header.toLowerCase(), <ResponseHeaders>{});
							});
						}
					}

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
				break;
			}
		}
	};

	xhr.onabort = (_e: ProgressEvent) => {
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