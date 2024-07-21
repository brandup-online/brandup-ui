import { QueryParams } from "../typings/app";
import BROWSER from "../browser";

const parseUrl = (url: string | null): ParsedUrl => {
	const loc = BROWSER.location;
	let origin: string = loc.origin;
	let path: string;
	let query: URLSearchParams | null = null;
	let hash: string | null = null;
	let isExternal = false;

	if (!url) {
		path = loc.pathname;

		if (loc.search)
			query = new URLSearchParams(loc.search);

		if (loc.hash)
			hash = loc.hash;
	}
	else {
		if (url.startsWith("#")) {
			path = loc.pathname;
			query = new URLSearchParams(loc.search);
			hash = url;
		}
		else if (url.startsWith("?")) {
			const hastIndex = url.lastIndexOf("#");
			if (hastIndex !== -1) {
				hash = url.substring(hastIndex);
				url = url.substring(0, hastIndex);
			}

			path = loc.pathname;
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
				let curPath = loc.pathname;
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

	rebuildUrl(result);

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

	rebuildUrl(url);
};

const rebuildUrl = (url: ParsedUrl) => {
	let relativeUrl = url.path;

	if (url.query.size)
		relativeUrl += "?" + url.query.toString();

	if (url.hash)
		relativeUrl += "#" + url.hash;

	url.full = url.origin + relativeUrl;
	url.relative = relativeUrl;
};

const buildUrl = (basePath: string, path?: string, query?: QueryParams | URLSearchParams | FormData, hash?: string) => {
	let url = basePath;
	if (path) {
		if (path.startsWith("/"))
			path = path.substring(1);
		url += path;
	}

	if (query) {
		let params: URLSearchParams;
		if (query instanceof URLSearchParams)
			params = query;
		else if (query instanceof FormData) {
			params = new URLSearchParams();
			query.forEach((value, key) => params.append(key, value.toString()))
		}
		else {
			params = new URLSearchParams();

			for (const key in query) {
				const value = query[key];
				if (value === null || typeof value === "undefined")
					continue;

				if (Array.isArray(value))
					value.forEach(v => params.append(key, v));
				else
					params.append(key, value);
			}
		}

		if (params.size)
			url += "?" + params.toString();
	}

	if (hash) {
		if (!hash.startsWith("#"))
			hash = "#" + hash;

		if (hash != "#")
			url += hash;
	}

	return url;
};

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
	buildUrl
};