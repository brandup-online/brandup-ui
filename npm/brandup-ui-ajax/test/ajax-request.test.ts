import { ajaxRequest } from "../source/ajax-request";

it("ajaxRequest rejects GET with data regardless of method case", () => {
	expect(() => ajaxRequest({ url: "/x", method: "GET", data: { a: "1" } }))
		.toThrow("GET method is not support request with data.");

	// lower-case method must be normalized before the guard runs
	expect(() => ajaxRequest({ url: "/x", method: "get", data: { a: "1" } }))
		.toThrow("GET method is not support request with data.");
});
