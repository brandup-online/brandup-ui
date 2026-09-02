import { Middleware, MiddlewareNext, StartContext, StopContext } from "./base";
import CONSTANTS from "../constants";

/** Unique name of the built-in hyperlink middleware. */
export const HYPERLINK_MIDDLEWARE_NAME = "app-hyperlink";

/**
 * Create the built-in hyperlink middleware that intercepts clicks on application links
 * (anchors with the `applink` class or elements with `data-nav-url`) and routes them through
 * application navigation. Honors meta/ctrl-click and `target="_blank"` to open in a new tab.
 * @returns The hyperlink middleware instance.
 */
const HyperLinkMiddlewareFactory = (): Middleware => {
	let onClick: (e: MouseEvent) => void | undefined;

	return {
		name: HYPERLINK_MIDDLEWARE_NAME,
		start: async (context: StartContext, next: MiddlewareNext) => {
			await next();

			window.addEventListener("click", onClick = (e: MouseEvent) => {
				let elem: Node | null = e.target as Node;
				let ignore = false;
				while (elem) {
					if (elem instanceof HTMLElement) {
						if (elem.hasAttribute(CONSTANTS.NavIgnoreAttributeName)) {
							ignore = true;
							break;
						}

						if (elem.classList.contains(CONSTANTS.NavUrlClassName) || elem.hasAttribute(CONSTANTS.NavUrlAttributeName))
							break;
					}

					elem = elem.parentElement;
				}

				if (!elem || e.ctrlKey || e.metaKey || elem.getAttribute("target") === "_blank")
					return;

				e.preventDefault();
				e.stopPropagation();

				if (ignore)
					return;

				let url: string | null;
				if (elem.tagName === "A")
					url = elem.getAttribute("href");
				else if (elem.hasAttribute(CONSTANTS.NavUrlAttributeName))
					url = elem.getAttribute(CONSTANTS.NavUrlAttributeName);
				else {
					// matched an applink element with no resolvable url (malformed markup);
					// swallow the click rather than throwing inside a global event listener
					console.warn("Application hyperlink: clicked element has no navigation url.");
					return;
				}

				if (elem.classList.contains(CONSTANTS.LoadingElementClass))
					return;
				elem.classList.add(CONSTANTS.LoadingElementClass);

				context.app
					.nav({
						url,
						replace: elem.hasAttribute(CONSTANTS.NavUrlReplaceAttributeName),
						scope: elem.getAttribute(CONSTANTS.NavUrlScopeAttributeName),
						clickElem: elem
					})
					.catch(() => { })
					.finally(() => elem.classList.remove(CONSTANTS.LoadingElementClass));
			}, false);
		},
		stop: (_context: StopContext, next: MiddlewareNext) => {
			window.removeEventListener("click", onClick, false);

			return next();
		}
	};
};

export default HyperLinkMiddlewareFactory;