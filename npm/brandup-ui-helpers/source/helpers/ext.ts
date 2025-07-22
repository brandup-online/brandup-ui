import { getProperty, hasProperty } from "./object";
import { formatText } from "./string";

declare global {
	interface String {
		format(...args: any[]): string;
	}

	interface ObjectConstructor {
		prop(obj: any, path: string): any;
		hasProp(obj: any, path: string): boolean;
	}
}

Object.prop = function (obj: any, path: string) {
	return getProperty(obj, path);
};

Object.hasProp = function (obj: any, path: string) {
	return hasProperty(obj, path);
};

String.prototype.format = function (...args: any[]): string {
	return formatText(this.toString(), ...args);
};
