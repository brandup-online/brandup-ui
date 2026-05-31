import { request } from "../source/request";

const mockFetch = () => {
	const calls: RequestInit[] = [];
	const original = global.fetch;

	global.fetch = ((_url: any, init: RequestInit) => {
		calls.push(init);
		return Promise.resolve(new Response("ok", {
			status: 200,
			headers: { "content-type": "text/plain" }
		}));
	}) as any;

	return { calls, restore: () => { global.fetch = original; } };
};

it("request bypasses cache with no-store when disableCache is set", async () => {
	const { calls, restore } = mockFetch();

	try {
		await request({ url: "http://localhost/data", disableCache: true });
		expect(calls[0].cache).toEqual("no-store");

		await request({ url: "http://localhost/data" });
		expect(calls[1].cache).toEqual("default");
	}
	finally {
		restore();
	}
});
