import { AjaxRequest, AjaxResponse } from "./types";
import { request } from "./request";

/** Queue that executes AJAX requests one at a time, in the order they were added. */
export class AjaxQueue {
	private _options: AjaxQueueOptions;
	private _requests: Array<RequestTask> = [];
	private _current: RequestTask | null = null;
	private _destroyed = false;

	/** @param options Optional queue-wide hooks. */
	constructor(options?: AjaxQueueOptions) {
		this._options = options ?? {};
	}

	/** Number of requests waiting in the queue (excluding the one currently executing). */
	get length(): number { return this._requests.length; }
	/** `true` when nothing is queued and no request is currently executing. */
	get isFree(): boolean { return !this._requests.length && !this._current; }
	/** `true` when no requests are waiting in the queue (a request may still be executing). */
	get isEmpty(): boolean { return !this._requests.length; }

	/**
	 * Adds a request to the queue. Starts executing immediately if the queue is idle.
	 *
	 * @param request Request options; its `success`/`error` callbacks are invoked as usual.
	 * @param abortSignal Optional signal used to cancel this specific request.
	 * @throws If the queue has been destroyed.
	 */
	push(request: AjaxRequest, abortSignal?: AbortSignal) {
		if (this._destroyed)
			throw new Error("AjaxQueue is destroyed.");

		this._requests.push({ request, cancel: abortSignal });

		if (!this._current)
			this.__execute();
	}

	/**
	 * Adds a request to the queue and returns a promise for its response.
	 *
	 * Wraps {@link push}; the request's own `success`/`error` callbacks are still invoked,
	 * then the promise resolves with the response or rejects with the failure reason.
	 *
	 * @param request Request options.
	 * @param abortSignal Optional signal used to cancel this specific request.
	 * @returns A promise resolving with the {@link AjaxResponse}.
	 */
	enqueue<TResponse = any>(request: AjaxRequest, abortSignal?: AbortSignal) {
		const { success, error } = request;

		return new Promise<AjaxResponse<TResponse>>((resolve, reject) => {
			request.success = (response: AjaxResponse<TResponse>) => {
				if (success)
					success(response);

				resolve(response);
			};
			request.error = (request: AjaxRequest, reason?: any) => {
				if (error)
					error(request, reason);

				reject(reason);
			};

			this.push(request, abortSignal);
		});
	}

	/** @deprecated Renamed to {@link enqueue}. */
	enque<TResponse = any>(request: AjaxRequest, abortSignal?: AbortSignal) {
		return this.enqueue<TResponse>(request, abortSignal);
	}

	/**
	 * Clears all queued (not-yet-started) requests.
	 *
	 * @param cancelCurrentRequest When `true`, also aborts the request currently executing.
	 */
	reset(cancelCurrentRequest = false) {
		this._requests = [];

		const current = this._current;
		this._current = null;

		if (cancelCurrentRequest && current)
			current.abort?.abort("ResetAjaxQueue");
	}

	/** Destroys the queue: clears pending requests and aborts the current one. Subsequent {@link push} calls throw. */
	destroy() {
		if (this._destroyed)
			return;
		this._destroyed = true;

		this._requests = [];

		if (this._current) {
			this._current.abort?.abort("DestroyAjaxQueue");
			this._current = null;
		}
	}

	private __execute() {
		if (this._destroyed)
			return;

		if (this._current)
			throw new Error("AjaxQueue currently is executing.");

		const task = this._current = this._requests.shift() ?? null;

		if (task) {
			if (this._options.canRequest && this._options.canRequest(task.request) === false) {
				this.__next(task);
				return;
			}

			if (task.request.abort?.aborted || task.cancel?.aborted) {
				const err = new Error("Request cancelled");
				task.request.error?.(task.request, err);
				task.result = Promise.reject(err);
			}
			else {
				task.abort = new AbortController();
				task.result = request(task.request, task.cancel ? AbortSignal.any([task.abort.signal, task.cancel]) : task.abort.signal);
			}

			task.result
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
				.finally(() => this.__next(task));
		}
	}

	// completedTask is the task that finished — if _current already changed
	// (e.g. reset(true) was called and a new push() started a new task), bail out
	// to avoid clearing the new task's reference or double-executing the queue.
	private __next(completedTask: RequestTask) {
		if (this._destroyed)
			return;
		if (this._current !== completedTask)
			return;

		this._current = null;
		this.__execute();
	}
}

/** Queue-wide hooks invoked for every request processed by an {@link AjaxQueue}. */
export interface AjaxQueueOptions {
	/** Called before a request is sent; returning `false` skips it (it is dropped without being sent). */
	canRequest?: (request: AjaxRequest) => boolean | void;
	/** Called after a request completes successfully. */
	successRequest?: (request: AjaxRequest, response: AjaxResponse) => void;
	/** Called when a request fails or is aborted. */
	errorRequest?: (response: AjaxRequest, reason?: any) => void;
}

interface RequestTask {
	readonly request: AjaxRequest;
	cancel?: AbortSignal;
	abort?: AbortController;
	result?: Promise<AjaxResponse>;
}