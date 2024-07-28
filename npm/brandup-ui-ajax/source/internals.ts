import { AjaxRequest } from "./types";
import * as helpers from "./helpers";

const DEFAULT_TIMEOUT = 30000;
const FORM_URL = "application/x-www-form-urlencoded";
const FORM_DATA = "multipart/form-data";

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
					body = helpers.encodeForm(body);
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

export default {
	DEFAULT_TIMEOUT,
	FORM_URL,
	FORM_DATA,
	detectRequestType,
	prepareRequest
}