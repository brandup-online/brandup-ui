import { QueryParams } from "../typings/app";

const parseUrl = (url: string | null): ParsedUrl => {
	let origin: string = location.origin;
	let path: string;
	let query: URLSearchParams | null = null;
	let hash: string | null = null;
	let isExternal = false;

	if (!url) {
		path = location.pathname;

		if (location.search)
			query = new URLSearchParams(location.search);

		if (location.hash)
			hash = location.hash;
	}
	else {
		if (url.startsWith("#")) {
			path = location.pathname;
			query = new URLSearchParams(location.search);
			hash = url;
		}
		else if (url.startsWith("?")) {
			const hastIndex = url.lastIndexOf("#");
			if (hastIndex !== -1) {
				hash = url.substring(hastIndex);
				url = url.substring(0, hastIndex);
			}

			path = location.pathname;
			query = new URLSearchParams(url);
		}
		else if (url.startsWith("http")) {
			const u = new URL(url);
			if (u.origin != origin) {
				origin = u.origin;
				isExternal = true;
			}

			path = u.pathname;
			query = u.searchParams;
			hash = u.hash || null;
		}
		else {
			const hastIndex = url.lastIndexOf("#");
			if (hastIndex !== -1) {
				hash = url.substring(hastIndex);
				url = url.substring(0, hastIndex);
			}

			const queryIndex = url.lastIndexOf("?");
			if (queryIndex !== -1) {
				query = new URLSearchParams(url.substring(queryIndex));
				url = url.substring(0, queryIndex);
			}

			path = url;

			if (!path.startsWith("/")) {
				let curPath = location.pathname;
				if (curPath.endsWith("/"))
					curPath = curPath.substring(0, curPath.length - 1);
				path = curPath + "/" + path;
			}
		}
	}

	if (!path)
		path = "/";
	else if (path.length > 1 && path.endsWith("/"))
		path = path.substring(0, path.length - 1);

	if (!query)
		query = new URLSearchParams();

	if (hash === "#")
		hash = null;
	else if (hash)
		hash = hash.substring(1);

	var result = {
		full: "",
		relative: "",
		origin,
		path,
		query,
		hash,
		external: isExternal
	};

	buildUrl(result);

	return result;
};

/**
 * Add or replace query parameters.
 * @param url Source url for extending query.
 * @param query New or update parameters.
 */
const extendQuery = (url: ParsedUrl, query: QueryParams | URLSearchParams | FormData) => {
	if (query instanceof URLSearchParams) {
		query.forEach((v, k) => url.query.delete(k));
		query.forEach((v, k) => url.query.append(k, v));
	}
	else if (query instanceof FormData) {
		query.forEach((v, k) => url.query.delete(k));
		query.forEach((v, k) => url.query.append(k, v.toString()));
	}
	else {
		for (let key in query) {
			const value = query[key];
			if (!Array.isArray(value)) {
				url.query.set(key, value);
			}
			else {
				url.query.delete(key);
				value.forEach(val => url.query.append(key, val));
			}
		}
	}

	buildUrl(url);
};

const buildUrl = (url: ParsedUrl) => {
	let relativeUrl = url.path;

	if (url.query.size)
		relativeUrl += "?" + url.query.toString();

	if (url.hash)
		relativeUrl += "#" + url.hash;

	url.full = url.origin + relativeUrl;
	url.relative = relativeUrl;
};

const queryIsNotEmpty = (query: URLSearchParams) => {
	let result = false;
	query.forEach(() => { result = true });
	return result;
}

export interface ParsedUrl {
	full: string;
	relative: string;
	origin: string;
	path: string;
	query: URLSearchParams;
	hash: string | null;
	external: boolean;
}

export default {
	parseUrl,
	extendQuery,
	queryIsNotEmpty
};