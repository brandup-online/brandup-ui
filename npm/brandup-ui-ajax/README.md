# brandup-ui-ajax

������ ��� ������� ������ � AJAX ���������.

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

## ������� AJAX ��������

```
const queue = new AjaxQueue();
queue.push({ request options });

class AjaxQueue {
    push(options: AjaxRequest): void;
    reset(abortCurrentRequest = false): void;
    destroy(): void;
}
```