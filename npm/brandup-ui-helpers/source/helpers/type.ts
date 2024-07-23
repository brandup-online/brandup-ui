function isFunction(value: any) {
	return (typeof value === "function");
}

function isString(value: any) {
	return (typeof value === "string" || value instanceof String);
}

export {
	isFunction,
	isString
}