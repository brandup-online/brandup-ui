import { AjaxRequestOptions, ajaxRequest } from "./ajax";
import Utility from "./utility";

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

        const successFunc = options.success;
        options.success = Utility.createDelegate2(this, this.__success, [successFunc]);

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