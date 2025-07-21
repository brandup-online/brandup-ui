import { AjaxRequest, AjaxResponse, ResponseType } from "./types";
import * as helpers from "./helpers";
import internals from "./internals";

/** Request with fetch. */
export async function request<TData = any, TState = any>(options: AjaxRequest<TState>, abortSignal?: AbortSignal): Promise<AjaxResponse<TData, TState>> {
	let { mode, credentials = "include" } = options;
	let url = options.url || location.href;
	url = helpers.addQuery(url, options.query);

	const method = options.method ? options.method.toUpperCase() : "GET";

	let body: any = options.data;
	if (body && (method === "GET" || method === "HEAD"))
		throw new Error("GET method is not support request with data.");

	internals.detectRequestType(options);
	const prepared = internals.prepareRequest(options, body);

	const abortSignals = [AbortSignal.timeout(options.timeout ?? internals.DEFAULT_TIMEOUT)];
	if (options.abort)
		abortSignals.push(options.abort);
	if (abortSignal)
		abortSignals.push(abortSignal);

	try {
		const response = await fetch(url, {
			method,
			headers: new Headers(prepared.headers),
			cache: options.disableCache ? "no-cache" : "default",
			mode,
			credentials,
			redirect: "follow",
			signal: AbortSignal.any(abortSignals),
			body: prepared.body
		});

		let result: AjaxResponse;

		switch (response.type) {
			case "basic":
			case "default":
			case "cors": {
				let responseData: any = null;
				let responseType: ResponseType = "none";

				let contentType = response.headers.get("content-type");
				if (!response.redirected && response.body) {
					if (contentType) {
						const ctSplitIndex = contentType.indexOf(";");
						if (ctSplitIndex > 0)
							contentType = contentType.substring(0, ctSplitIndex);

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
					headers: response.headers,
					data: responseData,
					state: options.state
				};

				break;
			}
			case "opaqueredirect":
			case "opaque":
				throw new Error(`Not supported response type: ${response.type}`);
			case "error":
				throw new Error("Response error.");
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