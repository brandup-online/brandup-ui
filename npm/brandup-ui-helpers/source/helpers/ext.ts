import { getProperty, hasProperty } from "./object";
import { formatText } from "./string";

declare global {
	interface String {
		/**
		 * Formats this string by substituting `{...}` placeholders.
		 *
		 * @param args Either a single model object whose properties fill named placeholders,
		 * or positional arguments referenced by zero-based index. See {@link formatText}.
		 * @returns The formatted string.
		 * @example
		 * "Hello, {name}".format({ name: "Dmitry" }); // "Hello, Dmitry"
		 * "Hello, {0}".format("Dmitry");              // "Hello, Dmitry"
		 */
		format(...args: any[]): string;
	}

	interface ObjectConstructor {
		/**
		 * Reads a nested property value by a dot-separated path. See {@link getProperty}.
		 *
		 * @param obj Source object.
		 * @param path Dot-separated property path, e.g. `"header.value"`.
		 * @returns The resolved value, or `undefined`/`null` when not found.
		 */
		prop(obj: any, path: string): any;

		/**
		 * Determines whether a nested property exists at a dot-separated path. See {@link hasProperty}.
		 *
		 * @param obj Source object.
		 * @param path Dot-separated property path, e.g. `"header.value"`.
		 * @returns `true` if the property exists, otherwise `false`.
		 */
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