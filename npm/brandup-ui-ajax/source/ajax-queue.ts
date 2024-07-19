import { AjaxRequest, AjaxResponse, request } from "./request";

export interface AjaxQueueOptions {
	canRequest?: (request: AjaxRequest) => void | boolean;
	successRequest?: (request: AjaxRequest, response: AjaxResponse) => void;
	errorRequest?: (response: AjaxRequest, reason?: any) => void;
}

export class AjaxQueue {
	private _options: AjaxQueueOptions;
	private _requests: Array<RequestTask> = [];
	private _curent: RequestTask | null = null;
	private _destroyed = false;

	constructor(options?: AjaxQueueOptions) {
		this._options = options ? options : {};
	}

	get length(): number { return this._requests.length; }
	get isFree(): boolean { return !this._requests.length && !this._curent; }
	get isEmpty(): boolean { return !this._requests.length; }

	push(request: AjaxRequest) {
		if (this._destroyed)
			throw new Error("AjaxQueue is destroyed.");

		this._requests.push({ request, abort: new AbortController() });

		if (!this._curent)
			this.__execute();
	}

	enque(request: AjaxRequest) {
		const { success, error } = request;

		return new Promise<AjaxResponse>((resolve, reject) => {
			request.success = (response: AjaxResponse) => {
				if (success)
					success(response);

				resolve(response);
			};
			request.error = (response: AjaxRequest, reason?: any) => {
				if (error)
					error(request, reason);

				reject(reason);
			};

			this.push(request);
		});
	}

	reset(cancelCurrentRequest = false) {
		this._requests = [];

		const current = this._curent;
		this._curent = null;

		if (cancelCurrentRequest && current)
			current.abort?.abort("ResetAjaxQueue");
	}

	destroy() {
		if (this._destroyed)
			return;
		this._destroyed = true;

		this._requests = [];

		if (this._curent) {
			this._curent.abort?.abort("DestroyAjaxQueue");
			this._curent = null;
		}
	}

	private __execute() {
		if (this._destroyed)
			return;

		if (this._curent)
			throw new Error("AjaxQueue currently is executing.");

		const task = this._curent = this._requests.shift() ?? null;

		if (task) {
			if (this._options.canRequest && this._options.canRequest(task.request) === false) {
				this.__next();
				return;
			}

			task.abort = new AbortController();

			task.xhr = request(task.request, task.abort.signal);
			task.xhr
				.then(response => {
					if (this._destroyed)
						return;

					if (this._options.successRequest)
						this._options.successRequest(task.request, response);
				})
				.catch(reason => {
					if (this._destroyed)
						return;

					if (this._options.errorRequest)
						this._options.errorRequest(task.request, reason);
				})
				.finally(() => this.__next());
		}
	}

	private __next() {
		if (this._destroyed)
			return;

		this._curent = null;
		this.__execute();
	}
}

interface RequestTask {
	readonly request: AjaxRequest;
	abort?: AbortController;
	xhr?: Promise<AjaxResponse>;
}