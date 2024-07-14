import { AjaxRequest, ajaxRequest, ajaxDelegate, AjaxResponse } from "./ajax";

export interface AjaxQueueOptions {
	preRequest?: (request: AjaxRequest) => void | boolean;
	postRequest?: (response: AjaxResponse) => void | boolean;
}

export class AjaxQueue {
	private _options: AjaxQueueOptions;
	private _requests: Array<{ options: AjaxRequest; xhr: XMLHttpRequest | null }> = [];
	private _curent: { options: AjaxRequest; xhr: XMLHttpRequest | null } | null = null;
	private _destroyed = false;

	constructor(options?: AjaxQueueOptions) {
		this._options = options ? options : {};
	}

	get length(): number { return this._requests.length; }
	get isFree(): boolean { return !this._requests.length && !this._curent; }
	get isEmpty(): boolean { return !this._requests.length; }

	push(options: AjaxRequest) {
		if (!options)
			throw "Ajax request options is required.";

		if (this._destroyed)
			return;

		const successFunc = options.success ? options.success : () => { };
		options.success = (response) => { this.__success(successFunc, response); };

		this._requests.push({ options: options, xhr: null });

		if (this._curent === null)
			this.__execute();
	}

	reset(abortCurrentRequest = false) {
		this._requests = [];

		if (abortCurrentRequest && this._curent) {
			this._curent.xhr?.abort();
			this._curent = null;
		}
	}

	destroy() {
		this._destroyed = true;
		this._requests = [];

		if (this._curent) {
			this._curent.xhr?.abort();
			this._curent = null;
		}
	}

	private __execute() {
		if (this._destroyed)
			throw "AjaxQueue is destroed.";
		if (this._curent)
			throw "AjaxQueue currently is executing.";

		this._curent = this._requests.shift() ?? null;
		if (this._curent) {
			if (this._options.preRequest) {
				if (this._options.preRequest(this._curent.options) === false) {
					this.__next();
					return;
				}
			}

			this._curent.xhr = ajaxRequest(this._curent.options);
		}
	}

	private __success(originSuccess: ajaxDelegate, response: AjaxResponse) {
		if (this._requests === null)
			return;

		if (this._options.postRequest) {
			if (this._options.postRequest(response) === false) {
				this.__next();
				return;
			}
		}

		try {
			originSuccess(response);
		}
		finally {
			this.__next();
		}
	}

	private __next() {
		this._curent = null;
		this.__execute();
	}
}