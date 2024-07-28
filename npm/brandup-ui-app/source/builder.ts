import { Application } from "./app";
import { Middleware } from "./middlewares/base";
import { ApplicationModel, EnvironmentModel } from "./types";

export class ApplicationBuilder<TModel extends ApplicationModel> {
	private __model: TModel;
	private __appType = Application<TModel>;
	private __middlewares: Middleware[] = [];

	constructor(model: TModel) {
		this.__model = model;
	}

	useApp(appType: typeof Application<TModel>) {
		this.__appType = appType;
		return this;
	}

	useMiddleware(createFunc: ((...params: Array<any>) => Middleware), ...params: Array<any>) {
		let midl = createFunc(...params);
		this.__middlewares.push(midl);
		return this;
	}

	build(env: EnvironmentModel, ...args: any[]) {
		if (!env.basePath)
			env.basePath = "/";

		const app = new this.__appType(env, this.__model, ...args);
		app.initialize(this.__middlewares);
		return app;
	}
}