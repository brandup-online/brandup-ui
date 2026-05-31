import { ajaxRequest } from "../source/ajax-request";

it("ajaxRequest rejects GET with data regardless of method case", () => {
	expect(() => ajaxRequest({ url: "/x", method: "GET", data: { a: "1" } }))
		.toThrow("GET method does not support a request body.");

	// lower-case method must be normalized before the guard runs
	expect(() => ajaxRequest({ url: "/x", method: "get", data: { a: "1" } }))
		.toThrow("GET method does not support a request body.");
});

it("ajaxRequest rejects HEAD with data", () => {
	expect(() => ajaxRequest({ url: "/x", method: "HEAD", data: { a: "1" } }))
		.toThrow("HEAD method does not support a request body.");
});
