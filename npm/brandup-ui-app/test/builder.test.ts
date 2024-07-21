import { Application, ApplicationBuilder, ApplicationModel, EnvironmentModel } from "../source/index";
import { ContextData, Middleware, MiddlewareNext, StartContext } from "../source/middlewares/base";

it('Custom app', () => {
	const appModel: TestApplicationModel = { websiteId: "id" };
	const appOptions: TestApplicationOptions = {
		pages: ["test"]
	};

	const builder = new ApplicationBuilder<TestApplicationModel>(appModel);
	builder.useApp(TestApplication);
	builder.useMiddleware(createMiddleware, "test");
	const app = <TestApplication>builder.build({ basePath: "/" }, appOptions);

	expect(app).not.toBeNull();
	expect(app.options).not.toBeNull();
	expect(app.options.pages).toContain("test");

	const middleware = app.middleware<TestMiddleware>("test");
	expect(middleware).not.toBeNull();
	expect(middleware.test).toEqual("test");
});

class TestApplication extends Application<TestApplicationModel> {
	readonly options: TestApplicationOptions;

	constructor(env: EnvironmentModel, model: TestApplicationModel, options: TestApplicationOptions) {
		super(env, model);

		this.options = options;
	}
}

interface TestApplicationModel {
	websiteId: string;
}

interface TestApplicationOptions {
	pages: string[];
}

interface TestMiddleware extends Middleware {
	test: string;
}

const createMiddleware = (test: string): TestMiddleware => {
	return {
		name: "test",
		test: test,
		start: async (context: StartContext<TestApplication, ContextData>, next: MiddlewareNext) => {
			await next();
		}
	};
}