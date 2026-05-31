/**
 * Reads a nested property value from an object by a dot-separated path.
 *
 * @param obj Source object to read from.
 * @param path Dot-separated property path, e.g. `"header.value"`.
 * @returns The resolved value; `null` when `obj` is falsy, or `undefined` when
 * any segment of the path does not exist.
 * @example
 * getProperty({ header: { value: "Item" } }, "header.value"); // "Item"
 */
function getProperty(obj: any, path: string): any {
	if (!obj)
		return null;

	const props = path.split('.');

	for (let i = 0; i < props.length; i++) {
		const name = props[i];
		if (!(name in obj))
			return undefined;

		obj = obj[name];
	}

	return obj;
}

/**
 * Determines whether an object has a nested property at the given dot-separated path.
 *
 * @param obj Source object to inspect.
 * @param path Dot-separated property path, e.g. `"header.value"`.
 * @returns `true` if every segment of the path exists, otherwise `false`.
 * @example
 * hasProperty({ header: { value: "Item" } }, "header.value"); // true
 */
function hasProperty(obj: any, path: string): boolean {
	if (!obj)
		return false;

	const props = path.split('.');

	for (let i = 0; i < props.length; i++) {
		const name = props[i];
		if (!(name in obj))
			return false;

		obj = obj[name];
	}

	return true;
}

export {
	getProperty,
	hasProperty
}