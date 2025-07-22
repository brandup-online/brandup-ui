import { getProperty } from "./object";

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
