import { QueryParams } from "./types";
import { Application } from "./app";
import CONSTANTS from "./constants";

declare global {
	interface HTMLElement {
		/** Build navigate by application. */
		nav(app: Application, path?: string, query?: QueryParams | URLSearchParams | FormData, hash?: string): this;
		/** Build navigate by url. */
		navUrl(url: string): this;
		/** Set navigation with replace. */
		navReplace(): this;
		/** Set navigation scope. */
		navScope(scope: string): this;
	}
}

HTMLElement.prototype.navUrl = function (url: string) {
	if (this instanceof HTMLAnchorElement)
		this.href = url;
	else
		this.dataset.navUrl = url;

	this.classList.add(CONSTANTS.NavUrlClassName);

	return this;
};

HTMLElement.prototype.nav = function (app: Application, path?: string, query?: QueryParams | URLSearchParams | FormData, hash?: string) {
	const url = app.buildUrl(path, query, hash);
	return this.navUrl(url);
};

HTMLElement.prototype.navReplace = function () {
	this.setAttribute(CONSTANTS.NavUrlReplaceAttributeName, "");
	return this;
};

HTMLElement.prototype.navScope = function (scope: string) {
	this.setAttribute(CONSTANTS.NavUrlScopeAttributeName, scope);
	return this;
};