import urlHelper from "../../source/helpers/url";

const setLocation = (url: string) => {
	window.location.href = url;
};

describe("parseUrl", () => {
	it("null url uses current location", () => {
		setLocation("http://localhost/page?a=1#sec");
		const r = urlHelper.parseUrl("", null);
		expect(r.path).toEqual("/page");
		expect(r.query.get("a")).toEqual("1");
		expect(r.hash).toEqual("sec");
		expect(r.origin).toEqual("http://localhost");
		expect(r.external).toBeFalsy();
	});

	it("hash-only url keeps current path/query", () => {
		setLocation("http://localhost/page?a=1");
		const r = urlHelper.parseUrl("", "#top");
		expect(r.path).toEqual("/page");
		expect(r.query.get("a")).toEqual("1");
		expect(r.hash).toEqual("top");
	});

	it("query-only url keeps current path", () => {
		setLocation("http://localhost/page");
		const r = urlHelper.parseUrl("", "?b=2#h");
		expect(r.path).toEqual("/page");
		expect(r.query.get("b")).toEqual("2");
		expect(r.hash).toEqual("h");
	});

	it("absolute same-origin url is not external", () => {
		setLocation("http://localhost/");
		const r = urlHelper.parseUrl("", "http://localhost/about?x=1#h");
		expect(r.external).toBeFalsy();
		expect(r.path).toEqual("/about");
		expect(r.query.get("x")).toEqual("1");
		expect(r.hash).toEqual("h");
	});

	it("absolute cross-origin url is external", () => {
		setLocation("http://localhost/");
		const r = urlHelper.parseUrl("", "https://other.com/p");
		expect(r.external).toBeTruthy();
		expect(r.origin).toEqual("https://other.com");
		expect(r.path).toEqual("/p");
	});

	it("relative url resolves against current path", () => {
		setLocation("http://localhost/dir/");
		const r = urlHelper.parseUrl("", "sub/page");
		expect(r.path).toEqual("/dir/sub/page");
	});

	it("path is lowercased and trailing slash trimmed", () => {
		setLocation("http://localhost/");
		const r = urlHelper.parseUrl("", "/About/");
		expect(r.path).toEqual("/about");
	});

	it("strips basePath from path", () => {
		setLocation("http://localhost/");
		const r = urlHelper.parseUrl("/account", "/account/profile");
		expect(r.basePath).toEqual("/account");
		expect(r.path).toEqual("/profile");
		expect(r.relative).toEqual("/account/profile");
	});

	it("basePath '/' is treated as empty", () => {
		setLocation("http://localhost/");
		const r = urlHelper.parseUrl("/", "/about");
		expect(r.basePath).toEqual("");
		expect(r.path).toEqual("/about");
	});
});

describe("buildUrl", () => {
	it("builds path + query + hash", () => {
		expect(urlHelper.buildUrl("", "/about", { a: "1" }, "sec")).toEqual("/about?a=1#sec");
	});

	it("prepends slash to path", () => {
		expect(urlHelper.buildUrl("", "about")).toEqual("/about");
	});

	it("includes basePath", () => {
		expect(urlHelper.buildUrl("/account", "profile")).toEqual("/account/profile");
	});

	it("supports array query values", () => {
		expect(urlHelper.buildUrl("", "/p", { a: ["1", "2"] })).toEqual("/p?a=1&a=2");
	});

	it("empty basePath and path produce '/'", () => {
		expect(urlHelper.buildUrl("")).toEqual("/");
	});

	it("supports FormData query", () => {
		const fd = new FormData();
		fd.append("x", "1");
		expect(urlHelper.buildUrl("", "/p", fd)).toEqual("/p?x=1");
	});
});

describe("extendQuery", () => {
	it("object sets and adds params", () => {
		setLocation("http://localhost/");
		const u = urlHelper.parseUrl("", "/p?a=1");
		urlHelper.extendQuery(u, { a: "2", b: "3" });
		expect(u.query.get("a")).toEqual("2");
		expect(u.query.get("b")).toEqual("3");
		expect(u.relative).toEqual("/p?a=2&b=3");
	});

	it("array values replace existing key", () => {
		setLocation("http://localhost/");
		const u = urlHelper.parseUrl("", "/p?a=1");
		urlHelper.extendQuery(u, { a: ["2", "3"] });
		expect(u.query.getAll("a")).toEqual(["2", "3"]);
	});

	it("URLSearchParams replaces matching keys and keeps others", () => {
		setLocation("http://localhost/");
		const u = urlHelper.parseUrl("", "/p?a=1&keep=9");
		urlHelper.extendQuery(u, new URLSearchParams("a=2"));
		expect(u.query.get("a")).toEqual("2");
		expect(u.query.get("keep")).toEqual("9");
	});
});
