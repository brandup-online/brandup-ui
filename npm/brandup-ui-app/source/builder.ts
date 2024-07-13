import { Application } from "./app";
import { Middleware } from "./middleware";
import { ApplicationModel, EnvironmentModel } from "./typings/app";

export class ApplicationBuilder<TModel extends ApplicationModel> {
	private __appType = Application<TModel>;
	private __middlewares: Array<Middleware<Application<TModel>, TModel>> = [];

	useApp(appType: typeof Application<TModel>) {
		this.__appType = appType;

		return this;
	}

	useMiddleware(middleware: Middleware<Application<TModel>, TModel>) {
		if (!middleware)
			throw `Middleware propery is required.`;

		this.__middlewares.push(middleware);

		return this;
	}

	build(env: EnvironmentModel, model: TModel) {
		if (!env)
			throw new Error("Parameter env is required.");
		if (!model)
			throw new Error("Parameter model is required.");

		if (!env.basePath)
			env.basePath = "/";

		return new this.__appType(env, model, this.__middlewares);
	}
}