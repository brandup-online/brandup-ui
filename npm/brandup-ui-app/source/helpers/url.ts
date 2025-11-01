import { QueryParams } from "../types";

const parseUrl = (basePath: string, url: string | null): ParsedUrl => {
	const loc = window.location;
	let origin: string = loc.origin;
	let path: string;
	let query: URLSearchParams | null = null;
	let hash: string | null = null;
	let isExternal = false;

	if (basePath === '/')
		basePath = '';

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
		path = '/';
	else if (path.length > 1 && path.endsWith('/'))
		path = path.substring(0, path.length - 1);

	path = path.toLowerCase();

	if (basePath) {
		if (path.toLowerCase().startsWith(basePath.toLowerCase())) {
			path = path.substring(basePath.length);
			if (!path)
				path = '/';
		}
		else
			basePath = '';
	}

	if (!query)
		query = new URLSearchParams();

	if (hash === '#')
		hash = null;
	else if (hash)
		hash = hash.substring(1);

	var result = {
		full: '',
		url: '',
		relative: '',
		origin,
		basePath,
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
		query.forEach((_v, k) => url.query.delete(k));
		query.forEach((v, k) => url.query.append(k, v));
	}
	else if (query instanceof FormData) {
		query.forEach((_v, k) => url.query.delete(k));
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

const rebuildUrl = (parsedUrl: ParsedUrl) => {
	let relativeUrl = parsedUrl.basePath + parsedUrl.path;
	if (relativeUrl.length > 1 && relativeUrl.endsWith('/'))
		relativeUrl = relativeUrl.substring(0, relativeUrl.length - 1);

	if (parsedUrl.query.size)
		relativeUrl += "?" + parsedUrl.query.toString();

	parsedUrl.url = parsedUrl.origin + relativeUrl;
	parsedUrl.relative = relativeUrl;

	parsedUrl.full = parsedUrl.hash ? `${parsedUrl.url}#${parsedUrl.hash}` : parsedUrl.url;
};

const buildUrl = (basePath: string, path?: string, query?: QueryParams | URLSearchParams | FormData, hash?: string) => {
	let url = basePath;
	if (url == '/')
		url = '';

	if (path) {
		if (!path.startsWith("/"))
			path = '/' + path;
		url += path;
	}

	if (!url)
		url = '/'
	else if (url.endsWith('/'))
		url = url.substring(0, url.length - 1);

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
	full: string; // origin, path, query and hash
	url: string; // origin, path and query, but without hash
	relative: string; // path and query, but without hash
	origin: string;
	basePath: string;
	path: string;
	query: URLSearchParams;
	hash: string | null;
	external: boolean; // origin is different of location.href
}

export default {
	parseUrl,
	extendQuery,
	buildUrl
};