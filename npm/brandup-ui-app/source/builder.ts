import { Application } from "./app";
import { Middleware } from "./middlewares/base";
import { ApplicationModel, EnvironmentModel } from "./types";

/** Fluent builder that configures the application type, middlewares and model, then constructs an {@link Application}. */
export class ApplicationBuilder<TModel extends ApplicationModel> {
	private __model: TModel;
	private __appType = Application<TModel>;
	private __middlewares: Middleware[] = [];

	/**
	 * @param model Application model used when building the application.
	 */
	constructor(model: TModel) {
		this.__model = model;
	}

	/**
	 * Set a custom application type to instantiate instead of the base {@link Application}.
	 * @param appType Application class constructor.
	 * @returns The builder, for chaining.
	 */
	useApp(appType: typeof Application<TModel>) {
		this.__appType = appType;
		return this;
	}

	/**
	 * Register a middleware via its factory function. Middlewares run in registration order.
	 * @param createFunc Factory that creates the middleware instance.
	 * @param params Optional arguments passed to the factory.
	 * @returns The builder, for chaining.
	 */
	useMiddleware(createFunc: ((...params: Array<any>) => Middleware), ...params: Array<any>) {
		let midl = createFunc(...params);
		this.__middlewares.push(midl);
		return this;
	}

	/**
	 * Build and initialize the application instance.
	 * @param env Application environment (a base path of `/` is normalized to empty).
	 * @param args Extra arguments forwarded to the application constructor.
	 * @returns The initialized application instance.
	 */
	build(env: EnvironmentModel, ...args: any[]) {
		const appEnv: EnvironmentModel = { ...env };
		if (!appEnv.basePath || appEnv.basePath == '/')
			appEnv.basePath = '';

		const app = new this.__appType(appEnv, this.__model, ...args);
		app.initialize(this.__middlewares);
		return app;
	}
}