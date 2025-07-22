import { getValue } from "./object";
import { formatText } from "./string";

declare global {
	interface String {
		format(...args: any[]): string;
	}

	interface ObjectConstructor {
		prop(obj: any, path: string): any;
	}
}

Object.prop = function (obj: any, path: string) {
	return getValue(obj, path);
};

String.prototype.format = function (...args: any[]): string {
	return formatText(this.toString(), ...args);
};
