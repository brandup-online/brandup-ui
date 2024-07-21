import { Application } from "./app";
import { Middleware } from "./middlewares/base";
import { ApplicationModel, EnvironmentModel } from "./typings/app";

export class ApplicationBuilder<TModel extends ApplicationModel> {
	private __appType = Application<TModel>;
	private __middlewares: Middleware[] = [];

	useApp(appType: typeof Application<TModel>) {
		this.__appType = appType;

		return this;
	}

	useMiddleware(middleware: ((...params: Array<any>) => Middleware) | Middleware, ...params: Array<any>) {
		if (!middleware)
			throw `Middleware propery is required.`;

		let midl: Middleware;
		if (typeof middleware === "function")
			midl = middleware(...params);
		else
			midl = middleware;

		this.__middlewares.push(midl);

		return this;
	}

	build(env: EnvironmentModel, model: TModel) {
		if (!env)
			throw new Error("Parameter env is required.");
		if (!model)
			throw new Error("Parameter model is required.");

		if (!env.basePath)
			env.basePath = "/";

		const app = new this.__appType(env, model);
		app.initialize(this.__middlewares);
		return app;
	}
}