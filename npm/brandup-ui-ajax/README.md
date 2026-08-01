# brandup-ui-ajax

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)](https://dev.azure.com/brandup/BrandUp%20Core/_build)

## Installation

Install NPM package [@brandup/ui-ajax](https://www.npmjs.com/package/@brandup/ui-ajax).

```bash
npm i @brandup/ui-ajax@latest
```

## AJAX request

Simplify async ajax request method. `request` is the `fetch`-based, promise-returning API.

```typescript
import { request } from "@brandup/ui-ajax";

await request({
		url?: string | null;
		query?: QueryData | null;
		method?: AJAXMethod | null;
		mode?: RequestMode;
		credentials?: RequestCredentials;
		timeout?: number | null;
		headers?: { [key: string]: string } | null;
		type?: AJAXRequestType | null;
		data?: string | object | Blob | FormData | HTMLFormElement | null;
		abort?: AbortSignal;
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

The response body is parsed by `Content-Type`: JSON, `text/html`, `text/plain`, otherwise a `Blob`. The default `timeout` is `30000` ms and `credentials` defaults to `"include"`.

### Request cancellation

A request is aborted when its `timeout` elapses, when the `abort` option signals, or when the second `abortSignal` argument signals.

```typescript
import { request } from "@brandup/ui-ajax";

const cancellation = new AbortController();

await request({ /* request options */ }, cancellation.signal)
	.catch(reason => console.error(reason));

cancellation.abort();
```

### Disable cache

Set `disableCache: true` to bypass HTTP caching. In `request` (fetch) this sends `cache: "no-store"`; in `ajaxRequest` (XHR) it appends a `_=<timestamp>` cache-busting query parameter.

```typescript
await request({ url: "/api/data", disableCache: true });
```

## AJAX request with XMLHttpRequest

`ajaxRequest` is the `XMLHttpRequest`-based API. It always sends credentials, delivers results via the `success`/`error` callbacks (it does not return a promise), and returns the underlying `XMLHttpRequest` so the call can be aborted. Unlike `request`, there is no `blob` response type.

```typescript
import { ajaxRequest } from "@brandup/ui-ajax";

const xhr = ajaxRequest({
	url: "/api/data",
	method: "POST",
	data: { name: "value" },
	success: response => {
		// response.status, response.data, response.type, ...
	},
	error: (request, reason) => console.error(reason)
});

xhr.abort(); // cancel the request
```

## Queue requests

Sequential execution of AJAX requests.

```typescript
import { AjaxQueue } from "@brandup/ui-ajax";

const queue = new AjaxQueue({
	canRequest?: (request: AjaxRequest) => boolean | void;
	successRequest?: (request: AjaxRequest, response: AjaxResponse) => void;
	errorRequest?: (response: AjaxRequest, reason?: any) => void;
});

queue.push({ /* request options */ }); // enqueue a request (fire and forget)

queue.push({ /* request options */ }, abortSignal); // with per-request cancellation

queue.reset(); // clear queue without aborting current request

queue.reset(true); // abort current request and clear queue

queue.destroy(); // clear queue, abort current request; further push() throws
```

Queue state can be inspected via `queue.length` (waiting requests), `queue.isEmpty` (nothing waiting) and `queue.isFree` (nothing waiting and nothing executing).

### Awaiting a queued request

`enqueue` queues a request like `push`, but returns a promise that resolves with the response (or rejects with the failure reason). The request's own `success`/`error` callbacks are still invoked.

```typescript
import { AjaxQueue } from "@brandup/ui-ajax";

const queue = new AjaxQueue();

const response = await queue.enqueue({ url: "/api/data" });
// response.status, response.data, ...
```
