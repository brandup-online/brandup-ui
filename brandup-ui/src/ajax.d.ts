export declare type AJAXMethod = "GET" | "POST" | "PUT" | "DELETE";
export interface AjaxRequestOptions {
    url?: string;
    urlParams?: {
        [key: string]: string;
    };
    method?: AJAXMethod;
    timeout?: number;
    headers?: {
        [key: string]: string;
    };
    type?: "NONE" | "JSON" | "XML" | "FORM" | "FORMDATA" | "TEXT";
    data?: string | FormData | Object | File;
    success?: (data: any, status: number, xhr: XMLHttpRequest) => void;
    disableCache?: boolean;
}
export interface AjaxQueueOptions {
    onPreRequest?: (ajaxOptions: AjaxRequestOptions) => void;
}
export declare class AjaxQueue {
    private _options;
    private _q;
    private __cur;
    constructor(options?: AjaxQueueOptions);
    request(options: AjaxRequestOptions): void;
    destroy(): void;
    private __execute;
    private __success;
}
export declare var ajaxRequest: (options: AjaxRequestOptions) => XMLHttpRequest;
