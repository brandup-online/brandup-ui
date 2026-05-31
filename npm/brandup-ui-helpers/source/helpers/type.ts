/**
 * Determines whether the given value is a function.
 *
 * @param value Value to test.
 * @returns `true` if the value is a function, otherwise `false`.
 */
function isFunction(value: any) {
	return (typeof value === "function");
}

/**
 * Determines whether the given value is a string.
 *
 * Returns `true` for both string primitives and `String` object instances.
 *
 * @param value Value to test.
 * @returns `true` if the value is a string, otherwise `false`.
 */
function isString(value: any) {
	return (typeof value === "string" || value instanceof String);
}

export {
	isFunction,
	isString
}