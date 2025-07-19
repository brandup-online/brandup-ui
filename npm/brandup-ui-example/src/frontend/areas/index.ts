import { ApplicationBuilder } from "@brandup/ui-app";
import { ExampleApplicationModel } from "../typings/app";

const AREAS: { [key: string]: AreaDefinition } = {};

export interface AreaDefinition {
	readonly name: string;
	readonly basePath: string;
	readonly app: () => Promise<{ default: () => ApplicationBuilder<ExampleApplicationModel> }>;
}

export interface AreaOptions {
	app: () => Promise<{ default: () => ApplicationBuilder<ExampleApplicationModel> }>;
}

const registerArea = (name: string, options: AreaOptions) => {
	if (typeof name !== "string" || name.indexOf('/') >= 0)
		throw new Error('Invalid area name.');

	AREAS[name] = {
		name,
		basePath: name ? `/${name}` : '',
		app: options.app
	};
}

const findArea = (fullPath?: string): AreaDefinition | null => {
	if (fullPath === undefined)
		fullPath = location.pathname;

	let areaName = fullPath.toLowerCase();
	if (areaName && areaName.startsWith("/"))
		areaName = areaName.substring(1);
	if (areaName.indexOf("/") !== -1)
		areaName = areaName.substring(0, areaName.indexOf("/"));

	return AREAS[areaName] ?? null;
}

export default {
	registerArea,
	findArea
}