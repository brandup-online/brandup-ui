import { AjaxRequest, ajaxRequest, ajaxDelegate, AjaxResponse } from "./ajax";

export interface AjaxQueueOptions {
	preRequest?: (request: AjaxRequest) => void | boolean;
	postRequest?: (response: AjaxResponse) => void | boolean;
}

export class AjaxQueue {
	private _options: AjaxQueueOptions;
	private _requests: Array<{ options: AjaxRequest; xhr?: XMLHttpRequest }>;
	private _curent!: { options: AjaxRequest; xhr?: XMLHttpRequest };

	constructor(options?: AjaxQueueOptions) {
		this._requests = [];
		this._curent = null;
		this._options = options ? options : {};
	}

	get length(): number { return this._requests.length; }
	get isFree(): boolean { return !this._requests.length && !this._curent; }
	get isEmpty(): boolean { return !this._requests.length; }

	push(options: AjaxRequest) {
		if (!options)
			throw "Ajax request options is required.";

		if (!this._requests)
			return;

		const successFunc = options.success ? options.success : () => { return; };
		options.success = (response) => { this.__success(successFunc, response); };

		this._requests.push({ options: options });

		if (this._curent === null)
			this.__execute();
	}

	reset(abortCurrentRequest = false) {
		this._requests = [];

		if (abortCurrentRequest && this._curent) {
			this._curent.xhr.abort();
			this._curent = null;
		}
	}

	destroy() {
		this._requests = null;

		if (this._curent) {
			this._curent.xhr.abort();
			this._curent = null;
		}
	}

	private __execute() {
		if (this._requests === null)
			throw "Ajax queue is destroed.";
		if (this._curent !== null)
			throw "Ajax queue currently is executing.";

		this._curent = this._requests.shift();
		if (this._curent) {
			if (this._options.preRequest) {
				if (this._options.preRequest(this._curent.options) === false) {
					this.__next();
					return;
				}
			}

			this._curent.xhr = ajaxRequest(this._curent.options);
		}
		else
			this._curent = null;
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