export type AJAXMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface AjaxRequestOptions {
    url?: string;
    urlParams?: { [key: string]: string };
    method?: AJAXMethod;
    timeout?: number;
    headers?: { [key: string]: string };
    type?: "NONE" | "JSON" | "XML" | "FORM" | "FORMDATA" | "TEXT";
    data?: string | FormData | object | File;
    success?: (data: any, status: number, xhr: XMLHttpRequest) => void;
    disableCache?: boolean;
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

export const ajaxRequest = (options: AjaxRequestOptions) => {
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
        if (data instanceof File)
            options.type = "NONE";
        //else if (data instanceof FormData)
        //    options.type = "FORMDATA";
        else if (data instanceof Object)
            options.type = "JSON";
        else if (typeof data === "string")
            options.type = "TEXT";
    }

    if (options.type) {
        let type: string;
        let accept: string;

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
                    const url = [];

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

                    options.success(responseData, x.status, x);
                }
                break;
            }
        }
    };

    return xhr;
};