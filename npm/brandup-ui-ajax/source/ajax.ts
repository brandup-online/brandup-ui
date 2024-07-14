export type AJAXMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type AJAXReqestType = "NONE" | "JSON" | "XML" | "FORM" | "FORMDATA" | "TEXT" | "BLOB";

export type ajaxDelegate = (response: AjaxResponse) => void;
export type abortDelegate = (request: AjaxRequest, xhr: XMLHttpRequest) => void;

const FORM_URL = "application/x-www-form-urlencoded";
const FORM_DATA = "multipart/form-data";

const encodeForm = (data: FormData) => {
	const query = new URLSearchParams();

	data.forEach((value: FormDataEntryValue, key: string) => {
		if (!key)
			return;

		query.append(key, value.toString());
	});

	return query.toString();
};

export interface AjaxRequest<TState = any> {
	url?: string | null;
	urlParams?: { [key: string]: string } | null;
	method?: AJAXMethod | null;
	timeout?: number | null;
	headers?: { [key: string]: string } | null;
	type?: AJAXReqestType | null;
	data?: string | FormData | object | File | HTMLFormElement | null;
	success?: ajaxDelegate | null;
	abort?: abortDelegate | null;
	disableCache?: boolean | null;
	state?: TState | null;
}
export interface AjaxResponse<TData = any, TState = any> {
	data: TData;
	status: number;
	xhr: XMLHttpRequest;
	state: TState;
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
};

export const ajaxRequest = (options: AjaxRequest) => {
	if (!options)
		throw new Error();

	const xhr = new XMLHttpRequest();
	xhr.withCredentials = true;
	if (options.timeout === 0 || options.timeout)
		xhr.timeout = options.timeout;

	let url = options.url ? options.url : location.href;
	let urlParams = options.urlParams;
	if (options.disableCache) {
		if (!urlParams) urlParams = {};
		urlParams["_"] = new Date().getTime().toString();
	}

	if (urlParams) {
		let urlQueryStr = "";
		let i = 0;
		for (const key in urlParams) {
			const val = urlParams[key];
			if (val === null)
				continue;

			urlQueryStr += (i === 0 ? "" : "&") + key;

			if (val !== "")
				urlQueryStr += "=" + encodeURIComponent(val);

			i++;
		}

		if (urlQueryStr) {
			if (url.indexOf("?") === -1)
				url += "?";
			else
				url += "&";

			url += urlQueryStr;
		}
	}

	const method = options.method ? options.method : "GET";
	xhr.open(method, url, true);
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

	let data: any = options.data;

	if (!options.type && data) {
		if (data instanceof Blob)
			options.type = "BLOB";
		else if (data instanceof FormData)
			options.type = null;
		else if (data instanceof HTMLFormElement)
			options.type = "FORM";
		else if (data instanceof Object)
			options.type = "JSON";
		else if (typeof data === "string")
			options.type = "TEXT";
	}

	if (options.type) {
		let type: string | null = null;
		let accept: string | null = null;

		switch (options.type) {
			case "XML":
				type = "application/xml; charset=utf-8";
				accept = "application/xml, text/xml, */*; q=0.01";
				break;
			case "JSON":
				type = "application/json; charset=utf-8";
				accept = "application/json, text/json, */*; q=0.01";

				data = JSON.stringify(data);

				break;
			case "FORM":
				if (data instanceof HTMLFormElement) {
					const form = <HTMLFormElement>data;
					type = form.enctype ?? FORM_URL;
					data = new FormData(form);
				}
				else if (data instanceof FormData)
					type = FORM_URL;

				if (type == FORM_URL)
					data = encodeForm(data);
				else if (type == FORM_DATA)
					type = null; // �� ������, ��� ��� �� ����� ���������� �������������

				break;
			case "FORMDATA":
				break;
			case "TEXT":
				type = "text/plain";
				break;
			case "BLOB":
				break;
		}

		if (accept)
			xhr.setRequestHeader('Accept', accept);
		if (type)
			xhr.setRequestHeader('Content-Type', type);
	}

	if (options.headers) {
		for (const key in options.headers) {
			const value = options.headers[key];
			if (!value)
				continue;
			xhr.setRequestHeader(key, value);
		}
	}

	if (method === "GET" || !data)
		xhr.send();
	else
		xhr.send(data);

	xhr.onreadystatechange = (e: Event) => {
		const x = e.target as XMLHttpRequest;

		switch (x.readyState) {
			case XMLHttpRequest.DONE: {
				if (options.success) {
					let responseData: any = null;

					if (x.response) {
						const ct = x.getResponseHeader("Content-Type");
						if (ct && (ct.indexOf("application/json", 0) === 0 || ct.indexOf("application/problem+json", 0) === 0))
							responseData = JSON.parse(x.responseText);
						else if (ct && ct.indexOf("application/xml", 0) === 0)
							responseData = x.responseXML;
						else
							responseData = x.responseText;
					}

					options.success({
						data: responseData,
						status: x.status,
						xhr: x,
						state: options.state
					});
				}
				break;
			}
		}
	};

	xhr.onabort = (e: ProgressEvent) => {
		if (options.abort)
			options.abort(options, <XMLHttpRequest>e.target);
	}

	return xhr;
};