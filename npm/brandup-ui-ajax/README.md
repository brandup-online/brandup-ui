# brandup-ui-ajax

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)](https://dev.azure.com/brandup/BrandUp%20Core/_build/latest?definitionId=69&branchName=master)

## Installation

Install NPM package [brandup-ui-ajax](https://www.npmjs.com/package/brandup-ui-ajax).

```
npm i brandup-ui-ajax@latest
```

## ajaxRequest

Методы для простой работы с AJAX запросами.

```
ajaxRequest({
    url?: string;
    urlParams?: { [key: string]: string };
    method?: AJAXMethod;
    timeout?: number;
    headers?: { [key: string]: string };
    type?: AJAXReqestType;
    data?: string | FormData | object | File;
    success?: ajaxDelegate;
    abort?: abortDelegate;
    disableCache?: boolean;
    state?: any;
});
```

## Очередь AJAX запросов

```
const queue = new AjaxQueue();
queue.push({ request options });

class AjaxQueue {
    push(options: AjaxRequest): void;
    reset(abortCurrentRequest = false): void;
    destroy(): void;
}
```