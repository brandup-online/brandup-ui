import { FuncHelper } from "../../source/index";

it('FuncHelper timeout success', async () => {
	const result = await FuncHelper.timeout(new Promise<string>((resolve, _reject) => {
		resolve("test");
	}), 5000);

	expect("test").toEqual(result);
});

it('FuncHelper timeout error', async () => {
	await expect(FuncHelper.timeout(new Promise<string>((_resolve, reject) => {
		reject(new Error("error"));
	}), 5000)).rejects.toThrow("error");
});

it('FuncHelper timeout timeout', async () => {
	await expect(FuncHelper.timeout(new Promise<string>((resolve, _reject) => {
		setTimeout(() => resolve("test"), 2000);
	}), 1000)).rejects.toEqual(FuncHelper.TIMEOUT_REASON);
});

it('FuncHelper timeout cancel', async () => {
	const abort = new AbortController();
	abort.abort("CANCEL");

	await expect(FuncHelper.timeout(new Promise<string>((resolve, _reject) => {
		setTimeout(() => resolve("test"), 2000);
	}), 1000, abort.signal)).rejects.toEqual(abort.signal.reason);
});

it('FuncHelper timeout invalid', async () => {
	await expect(FuncHelper.timeout(new Promise<string>((resolve, _reject) => {
		resolve("test");
	}), 0)).rejects.toThrow("Invalid timeout value.");

	await expect(FuncHelper.timeout(new Promise<string>((resolve, _reject) => {
		resolve("test");
	}), -1)).rejects.toThrow("Invalid timeout value.");
});

it('FuncHelper delay resolves', async () => {
	await expect(FuncHelper.delay(20)).resolves.toBeUndefined();
});

it('FuncHelper delay rejects when already aborted', async () => {
	const abort = new AbortController();
	abort.abort("CANCEL");

	await expect(FuncHelper.delay(50, abort.signal)).rejects.toEqual("CANCEL");
});

it('FuncHelper delay rejects when aborted during wait', async () => {
	const abort = new AbortController();

	const promise = FuncHelper.delay(1000, abort.signal);
	abort.abort("CANCEL");

	await expect(promise).rejects.toEqual("CANCEL");
});