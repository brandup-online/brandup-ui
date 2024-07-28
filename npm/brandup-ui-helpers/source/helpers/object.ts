function hasProperty(obj: any, property: string): boolean {
	if (!obj)
		return false;

	const props = property.split(".");

	let t = obj;
	for (let i = 0; i < props.length; i++) {
		if (!t)
			return false;

		const pName = props[i];
		if (!(pName in t))
			return false;

		t = t[pName];
	}

	return true;
}

function getProperty(obj: any, property: string): any {
	if (!obj)
		return null;

	const props = property.split(".");

	let t = obj;
	for (let i = 0; i < props.length; i++) {
		const pName = props[i];
		if (!(pName in t))
			return undefined;

		t = t[pName];
	}

	return t;
}

export {
	hasProperty,
	getProperty
}