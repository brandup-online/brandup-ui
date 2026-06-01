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

let __inited = false;

/**
 * Install the `HTMLElement.prototype` navigation helpers (`nav`, `navUrl`, `navReplace`,
 * `navScope`). Opt-in (no longer a side effect on import) so bundlers can tree-shake them
 * away when unused. {@link Application} calls this automatically on `run`; call it yourself
 * only if you use the helpers before the application starts. Idempotent; no-op without a DOM.
 */
export function enableNavExtensions(): void {
	if (__inited || typeof HTMLElement === "undefined")
		return;
	__inited = true;

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
}