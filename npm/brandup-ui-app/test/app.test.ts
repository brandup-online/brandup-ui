import { Application } from "../source/app";
import { ContextData } from "../source/middlewares/base";
import { DOM } from "@brandup/ui-dom";

const app = new Application({ basePath: "/" }, {});

it("Application.run success", async () => {
	const app = new Application({ basePath: "/" }, {});

	const appEleme = DOM.tag("div");
	const navContext = await app.run<TestContextData>({
		test: "value"
	}, appEleme);

	expect(navContext.app).toEqual(app);
	expect(navContext.data.test).toEqual("value");
});

it("Application.nav success", async () => {
	const app = new Application({ basePath: "/" }, {});
	const appEleme = DOM.tag("div");
	await app.run({}, appEleme);

	let navContext = await app.nav("/about");
	expect(navContext.source).toEqual("nav");
	expect(navContext.url).toEqual("http://localhost/about");
	expect(navContext.origin).toEqual("http://localhost");
	expect(navContext.pathAndQuery).toEqual("/about");
	expect(navContext.path).toEqual("/about");
	expect(navContext.query.size).toEqual(0);
	expect(navContext.hash).toBeNull();
	expect(navContext.replace).toEqual(false);
	expect(navContext.external).toEqual(false);

	// nav with data
	navContext = await app.nav<TestContextData>({ url: "/company", data: { test: "value" } });
	expect(navContext.path).toEqual("/company");
	expect(navContext.data.test).toEqual("value");

	// nav with extend query
	navContext = await app.nav({ url: "/company", query: { test: "value" } });
	expect(navContext.pathAndQuery).toEqual("/company?test=value");
	expect(navContext.query.get("test")).toEqual("value");

	// overide exist query param in url
	navContext = await app.nav({ url: "/company?test=value2", query: { test: "value" } });
	expect(navContext.pathAndQuery).toEqual("/company?test=value");
	expect(navContext.query.get("test")).toEqual("value");
});

interface TestContextData extends ContextData {
	test: string
}