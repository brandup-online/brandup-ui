import { getProperty } from "./object";

/**
 * Formats a template string by substituting `{...}` placeholders.
 *
 * When the first argument is an object, placeholders are treated as dot-separated
 * property paths resolved against that object (see {@link getProperty}). Otherwise
 * placeholders are treated as zero-based indexes into the remaining arguments.
 * Unresolved placeholders are replaced with an empty string.
 *
 * @param template Template containing `{name}` or `{0}` placeholders.
 * @param args Either a single model object, or positional arguments.
 * @returns The formatted string.
 * @example
 * formatText("Hello, {name}", { name: "Dmitry" }); // "Hello, Dmitry"
 * formatText("Hello, {0}", "Dmitry");              // "Hello, Dmitry"
 */
function formatText(template: string, ...args: any[]): any {
	if (!args.length) return template;

	const obj = typeof args[0] === "object" ? args[0] : null;

	return template.replace(/\{([^}]+)\}/g, (_match, key) => {
		if (obj) return getProperty(obj, key) ?? "";
		else {
			const paramIndex = parseInt(key);
			if (!isNaN(paramIndex) && paramIndex < args.length)
				return args[paramIndex] ?? "";
		}

		return "";
	});
}

export { formatText };
