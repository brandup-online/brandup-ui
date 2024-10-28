const minWait = (func: (...args: any[]) => void, minTime?: number) => {
	if (!minTime)
		return func;

	const beginTime = Date.now();

	const ret = (...args: any[]) => {
		const rightTime = getRightTime(beginTime, minTime);
		if (rightTime)
			window.setTimeout(() => func(...args), rightTime);
		else
			func(...args);
	};

	return ret;
};

async function minWaitAsync<TResult>(func: () => Promise<TResult>, minTime?: number, abort?: AbortSignal): Promise<TResult> {
	if (!minTime)
		return func();

	const beginTime = Date.now();
	const result = await func();

	const rightTime = getRightTime(beginTime, minTime);
	if (rightTime)
		await delay(rightTime, abort);

	return result;
};

const getRightTime = (start: number, minTime: number) => {
	const finishTime = Date.now();
	const w = minTime - (finishTime - start);

	return w > minTime * 0.1 ? w : 0;
}

function delay(time: number, abort?: AbortSignal): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		const timer = window.setTimeout(() => {
			if (abort && abort.aborted)
				reject(abort.reason);
			else
				resolve();
		}, time);

		abort?.addEventListener("abort", () => {
			window.clearTimeout(timer);
			reject(abort.reason);
		});
	});
}

function timeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		if (timeout <= 0)
			throw new Error("Invalid timeout value.");

		const timer = window.setTimeout(() => {
			reject(new Error(TIMEOUT_ERROR));
		}, timeout);

		promise
			.then(result => resolve(result))
			.catch(reason => reject(reason))
			.finally(() => window.clearTimeout(timer));
	});
}

export const TIMEOUT_ERROR = "Timeout";

export {
	minWait,
	minWaitAsync,
	delay,
	timeout
}