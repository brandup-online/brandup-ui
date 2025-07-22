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

function getValue (obj: any, path: string): string {
	const dotIndex = path.indexOf(".");
	if (dotIndex === -1) return obj[path];

	obj = obj[path.substring(0, dotIndex)];
	if (!obj) return obj;

	return getValue(obj, path.substring(dotIndex + 1));
};

export {
	hasProperty,
	getProperty,
	getValue
}