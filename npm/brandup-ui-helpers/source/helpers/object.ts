function getProperty(obj: any, property: string): any {
	if (!obj)
		return null;

	const props = property.split('.');

	for (let i = 0; i < props.length; i++) {
		const name = props[i];
		if (!(name in obj))
			return undefined;

		obj = obj[name];
	}

	return obj;
}

function hasProperty(obj: any, property: string): boolean {
	if (!obj)
		return false;

	const props = property.split('.');

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