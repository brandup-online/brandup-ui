import * as common from "./common"

export type AJAXMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export interface AjaxRequestOptions {
    url?: string;
    urlParams?: { [key: string]: string; };
    method?: AJAXMethod;
    timeout?: number;
    headers?: { [key: string]: string; };
    type?: "NONE" | "JSON" | "XML" | "FORM" | "FORMDATA" | "TEXT";
    data?: string | FormData | Object | File;
    success?: (data: any, status: number, xhr: XMLHttpRequest) => void;
    disableCache?: boolean;
}

export interface AjaxQueueOptions {
    onPreRequest?: (ajaxOptions: AjaxRequestOptions) => void;
}
export class AjaxQueue {
    private _options: AjaxQueueOptions;
    private _q: Array<{ options: AjaxRequestOptions, xhr?: XMLHttpRequest }>;
    private __cur!: { options: AjaxRequestOptions, xhr?: XMLHttpRequest } | null;

    constructor(options?: AjaxQueueOptions) {
        this._q = [];
        this.__cur = null;

        this._options = options ? options : {};
    }

    request(options: AjaxRequestOptions) {
        if (!options)
            throw new Error();

        var successFunc = options.success;
        var s = common.Utility.createDelegate2(this, this.__success, [successFunc]);
        options.success = s;

        this._q.push({ options: options });
        if (this.__cur === null)
            this.__execute();
    }
    destroy() {
        if (this.__cur) {
            this.__cur.xhr.abort();
            this.__cur = null;
        }
    }
    private __execute() {
        if (this._q === null)
            throw new Error("Queue is destroed.");
        if (this.__cur !== null)
            throw new Error("Queue is executing.");
        this.__cur = this._q.shift();
        if (this.__cur) {
            if (this._options.onPreRequest) {
                try {
                    this._options.onPreRequest(this.__cur.options);
                }
                catch { }
            }
            this.__cur.xhr = ajaxRequest(this.__cur.options);
        }
        else
            this.__cur = null;
    }
    private __success(originSuccess: (data: any, status: number, xhr: XMLHttpRequest) => void, data: any, status: number, xhr: XMLHttpRequest) {
        if (this._q === null)
            return;
        if (originSuccess) {
            try {
                originSuccess(data, status, xhr);
            }
            catch { }
        }
        this.__cur = null;
        this.__execute();
    }
}

var urlEncode = (data: string, rfc3986: boolean = true) => {
    data = encodeURIComponent(data);
    data = data.replace(/%20/g, '+');

    if (rfc3986) {
        data = data.replace(/[!'()*]/g, function (c) {
            return '%' + c.charCodeAt(0).toString(16);
        });
    }

    return data;
};

export var ajaxRequest = (options: AjaxRequestOptions) => {
    if (!options)
        throw new Error();

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    if (options.timeout === 0 || options.timeout)
        xhr.timeout = options.timeout;

    var url = options.url ? options.url : location.href;
    var urlParams = options.urlParams;
    if (options.disableCache) {
        if (!urlParams) urlParams = {};
        urlParams["_"] = new Date().getTime().toString();
    }

    if (urlParams) {
        let urlQueryStr = "";
        let i = 0;
        for (let key in urlParams) {
            let val = urlParams[key];
            if (val === null)
                continue;

            urlQueryStr += (i === 0 ? "" : "&") + key;

            if (val !== "")
                urlQueryStr += "=" + encodeURIComponent(val);

            i++;
        }

        if (urlQueryStr) {
            if (url.indexOf("?") == -1)
                url += "?";
            else
                url += "&";

            url += urlQueryStr;
        }
    }

    var method = options.method ? options.method : "GET";
    xhr.open(method, url, true);
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

    var data: any = options.data;

    if (!options.type && data) {
        if (data instanceof File)
            options.type = "NONE";
        else if (data instanceof FormData) { }
            //options.type = "FORMDATA";
        else if (data instanceof Object)
            options.type = "JSON";
        else if (typeof data === "string")
            options.type = "FORMDATA";
    }

    if (options.type) {
        var type: string;
        var accept: string;

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
                type = "application/x-www-form-urlencoded";

                if (data instanceof FormData) {
                    let url = [];

                    data.forEach((value: FormDataEntryValue, key: string) => {
                        if (!key)
                            return;
                        url.push(urlEncode(key) + '=' + urlEncode(value.toString()));
                    });

                    data = url.join('&');
                }

                break;
            case "FORMDATA":
                type = "multipart/form-data";
                break;
            case "TEXT":
                type = "text/plain";
                break;
        }

        if (accept)
            xhr.setRequestHeader('Accept', accept);
        if (type)
            xhr.setRequestHeader('Content-Type', type);
    }

    if (options.headers) {
        for (let key in options.headers) {
            var value = options.headers[key];
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
        var x = <XMLHttpRequest>e.target;

        switch (x.readyState) {
            case XMLHttpRequest.DONE: {
                if (options.success) {
                    var responseData: any = null;

                    if (x.response) {
                        var ct = x.getResponseHeader("Content-Type");
                        if (ct && (ct.indexOf("application/json", 0) === 0 || ct.indexOf("application/problem+json", 0) === 0))
                            responseData = JSON.parse(x.responseText);
                        else if (ct && ct.indexOf("application/xml", 0) === 0)
                            responseData = x.responseXML;
                        else
                            responseData = x.responseText;
                    }

                    options.success(responseData, x.status, x);
                }
                break;
            }
        }
    };

    return xhr;
};