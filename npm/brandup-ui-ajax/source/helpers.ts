import { QueryData } from "./types";

const createQuery = (query?: QueryData | FormData | null) => {
	const urlParams = new URLSearchParams();

	if (!query)
		return urlParams;

	if (query instanceof FormData) {
		query.forEach((value: FormDataEntryValue, key: string) => {
			if (!key)
				return;
			query.append(key, value.toString());
		});
	}
	else {
		for (const key in query) {
			const val = query[key];
			if (val === null)
				continue;

			if (Array.isArray(val))
				val.forEach(v => urlParams.append(key, v));
			else
				urlParams.append(key, val);
		}
	}

	return urlParams;
}

const addQuery = (url: string, query?: QueryData | FormData | null) => {
	if (query) {
		const urlParams = createQuery(query);

		if (urlParams.size) {
			if (url.indexOf("?") === -1)
				url += "?";
			else
				url += "&";

			url += urlParams.toString();
		}
	}

	return url;
}

const encodeForm = (data: FormData) => {
	const query = createQuery(data);
	return query.toString();
}

export {
	createQuery,
	addQuery,
	encodeForm
}