import { DOM } from "@brandup/ui-dom";
import { Application, NAV_OVERIDE_ERROR } from "../source/app";
import { ApplicationModel } from "../source/types";
import { ApplicationBuilder } from "../source/builder";
import { ContextData, Middleware, MiddlewareNext, NavigateContext, StartContext } from "../source/middlewares/base";

it("Application.run success", async () => {
	const builder = new ApplicationBuilder<TestAppModel>({ userId: "user" });
	builder.useMiddleware(() => new TestMiddleware());
	const app = builder.build({ basePath: "/" });

	const appEleme = DOM.tag("div");
	const startData: TestStartContextData = { test: "value" };
	const startContext = await app.run<TestStartContextData>(startData, appEleme);

	// check start context
	expect(startContext.app).toEqual(app);
	expect(startContext.data).toEqual(startData);
	expect(startContext.data.test).toEqual("value");
	expect(startContext.data.startBefore).toEqual(true);
	expect(startContext.data.startAfter).toEqual(true);
	expect(startContext.data.loadedBefore).toEqual(true);
	expect(startContext.data.loadedAfter).toEqual(true);
	expect(startContext.data.navContext).not.toBeNull();
	expect(startContext.data.navContext?.source).toEqual("first");

	// check app
	expect(app.abort.aborted).toBeFalsy();
	expect(app.current).toBeDefined();
	expect(app.current?.index).toEqual(1);
	expect(app.current?.source).toEqual("first");
	expect(app.current?.current).toBeUndefined();
	expect(app.current?.parent).toBeUndefined();
	expect(app.current?.overided).toBeFalsy();
	expect(app.current?.url).toEqual("http://localhost/");
	expect(app.current?.origin).toEqual("http://localhost");
	expect(app.current?.pathAndQuery).toEqual("/");
	expect(app.current?.path).toEqual("/");
	expect(app.current?.query.size).toEqual(0);
	expect(app.current?.hash).toBeNull();
	expect(app.current?.replace).toBeFalsy();
	expect(app.current?.external).toBeFalsy();
	expect(app.env.basePath).toEqual("/");
	expect(app.model.userId).toEqual("user");
});

it("Application.run redirect in first nav", async () => {
	const builder = new ApplicationBuilder<TestAppModel>({ userId: "user" });
	builder.useMiddleware(() => <Middleware>{
		name: "test",
		navigate: async (context: NavigateContext, next) => {
			await next();

			if (context.path === "/")
				await context.redirect("/about");
		}
	});
	const app = builder.build({ basePath: "/" });

	const appEleme = DOM.tag("div");
	await app.run({}, appEleme);

	expect(app.abort.aborted).toBeFalsy();
	expect(app.current).toBeDefined();
	expect(app.current?.index).toEqual(2);
	expect(app.current?.source).toEqual("nav");
	expect(app.current?.current).toBeUndefined();
	expect(app.current?.parent).toBeDefined();
	expect(app.current?.parent?.source).toEqual("first");
	expect(app.current?.parent?.url).toEqual("http://localhost/");
	expect(app.current?.parent?.overided).toBeTruthy();
	expect(app.current?.parent?.abort.aborted).toBeTruthy();
	expect(app.current?.overided).toBeFalsy();
	expect(app.current?.url).toEqual("http://localhost/about");
	expect(app.current?.origin).toEqual("http://localhost");
	expect(app.current?.pathAndQuery).toEqual("/about");
	expect(app.current?.path).toEqual("/about");
	expect(app.current?.query.size).toEqual(0);
	expect(app.current?.hash).toBeNull();
	expect(app.current?.replace).toBeFalsy();
	expect(app.current?.external).toBeFalsy();
});

it("Application.run error in first nav", async () => {
	const builder = new ApplicationBuilder<TestAppModel>({ userId: "user" });
	builder.useMiddleware(() => <Middleware>{
		name: "test",
		navigate: async (context: NavigateContext, next) => {
			await next();

			throw new Error("nav error");
		}
	});
	const app = builder.build({ basePath: "/" });

	const appEleme = DOM.tag("div");
	await expect(() => app.run({}, appEleme)).rejects.toThrow("nav error");

	expect(app.abort.aborted).toEqual(false);
});

it("Application.nav success", async () => {
	const builder = new ApplicationBuilder({});
	builder.useMiddleware(() => new TestMiddleware());
	const app = builder.build({ basePath: "/" });

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
	navContext = await app.nav({ url: "/company", data: { test: "value" } });
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

it("Application.nav redirect with nav", async () => {
	const builder = new ApplicationBuilder({});
	builder.useMiddleware(() => <Middleware>{
		name: "test",
		navigate: async (context: NavigateContext, next) => {
			await next();

			if (context.path === "/about")
				await context.app.nav("/company");
		}
	});
	const app = builder.build({ basePath: "/" });

	const appEleme = DOM.tag("div");
	await app.run({}, appEleme);

	const navContext = await app.nav("/about");
	expect(navContext.overided).toBeTruthy();
	expect(navContext.path).toEqual("/about");
});

it("Application.nav redirect", async () => {
	const builder = new ApplicationBuilder({});
	builder.useMiddleware(() => <Middleware>{
		name: "test",
		navigate: async (context: NavigateContext, next) => {
			await next();

			if (context.path === "/about")
				await context.redirect("/company");
		}
	});
	const app = builder.build({ basePath: "/" });

	const appEleme = DOM.tag("div");
	await app.run({}, appEleme);

	const navContext = await app.nav("/about");
	expect(navContext.overided).toBeFalsy();
	expect(navContext.path).toEqual("/company");
	expect(navContext.parent?.overided).toBeTruthy();
	expect(navContext.parent?.path).toEqual("/about");
	//await expect(app.nav("/about")).rejects.toEqual(NAV_OVERIDE_ERROR);
});

interface TestAppModel extends ApplicationModel {
	userId: string;
}

interface TestStartContextData extends ContextData {
	test: string;
	startBefore?: boolean;
	startAfter?: boolean;
	loadedBefore?: boolean;
	loadedAfter?: boolean;
	navContext?: NavigateContext<Application<TestAppModel>, TestStartContextData>;
}

class TestMiddleware implements Middleware {
	name = "test";

	async start(context: StartContext<Application<TestAppModel>, TestStartContextData>, next: MiddlewareNext) {
		context.data.startBefore = true;

		await next();

		context.data.startAfter = true;
	}

	async loaded(context: StartContext<Application<TestAppModel>, TestStartContextData>, next: MiddlewareNext) {
		context.data.loadedBefore = true;

		await next();

		context.data.loadedAfter = true;
	}

	async navigate(context: NavigateContext<Application<TestAppModel>, TestStartContextData>, next: MiddlewareNext) {
		await next();

		context.data.navContext = context;
	}
}