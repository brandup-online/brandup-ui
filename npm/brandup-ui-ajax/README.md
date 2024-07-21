# brandup-ui-ajax

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui-ajax](https://www.npmjs.com/package/@brandup/ui-ajax).

```
npm i @brandup/ui-ajax@latest
```

## AJAX request

Simplify async ajax request method.

```
import { request } from "@brandup/ui-ajax";

await request({
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
	})
	.then(response => {
		// response.status: number;
		// response.redirected: boolean;
		// response.url: string | null;
		// response.type: "none" | "json" | "blob" | "text" | "html";
		// response.contentType: string | null;
		// response.data: TData | null;
		// response.state?: TState | null;
	})
	.catch(reason => console.error(reason));
```

### Request cancellation

```
import { request } from "@brandup/ui-ajax";

const cancellation = new AbortController();

await request({ }, cancellation.signal)
	.catch(reason => console.error(reason));
```

## Queue requests

Sequential execution of AJAX requests.

```
import { AjaxQueue } from "@brandup/ui-ajax";

const queue = new AjaxQueue({
	canRequest?: (request: AjaxRequest) => void | boolean;
	successRequest?: (request: AjaxRequest, response: AjaxResponse) => void;
	errorRequest?: (response: AjaxRequest, reason?: any) => void;
});

queue.push({ request options });

queue.reset(); // clear queue without abort current request

queue.reset(true); // abort current request and clear queue

queue.destroy();
```