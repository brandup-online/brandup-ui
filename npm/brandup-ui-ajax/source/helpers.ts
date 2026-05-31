import { QueryData } from "./types";

/**
 * Builds a `URLSearchParams` from query data or a `FormData`.
 *
 * Array values produce repeated keys; `null` values are skipped.
 *
 * @param query Source parameters.
 * @returns The populated `URLSearchParams` (empty when `query` is nullish).
 */
const createQuery = (query?: QueryData | FormData | null) => {
	const urlParams = new URLSearchParams();

	if (!query)
		return urlParams;

	if (query instanceof FormData) {
		query.forEach((value: FormDataEntryValue, key: string) => {
			if (!key)
				return;
			urlParams.append(key, value.toString());
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

/**
 * Appends query parameters to a URL, choosing `?` or `&` as appropriate.
 *
 * @param url Base URL.
 * @param query Parameters to append; nothing is added when empty.
 * @returns The resulting URL.
 */
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

/**
 * Encodes a `FormData` as an `application/x-www-form-urlencoded` string.
 *
 * @param data Form data to encode.
 * @returns The URL-encoded form string.
 */
const encodeForm = (data: FormData) => {
	const query = createQuery(data);
	return query.toString();
}

export {
	createQuery,
	addQuery,
	encodeForm
}