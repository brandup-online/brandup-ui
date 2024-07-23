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

function minWaitAsync<TResult>(func: () => Promise<TResult>, minTime?: number): Promise<TResult> {
	if (!minTime)
		return func();

	const beginTime = Date.now();

	return func()
		.then(data => {
			const rightTime = getRightTime(beginTime, minTime);
			if (rightTime)
				return new Promise<any>(resolve => window.setTimeout(() => resolve(data), rightTime));
			else
				return data;
		});
};

const getRightTime = (start: number, minTime: number) => {
	const finishTime = Date.now();
	const w = minTime - (finishTime - start);

	return w > minTime * 0.1 ? w : 0;
}

function delay(time: number, abort: AbortSignal): Promise<void> {
	return new Promise<void>(resolve => {
		const timer = window.setTimeout(() => resolve(), time);

		abort.addEventListener("abort", () => {
			window.clearTimeout(timer);
			resolve();
		});
	});
}

export {
	minWait,
	minWaitAsync,
	delay
}