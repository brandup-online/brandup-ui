import { Middleware, MiddlewareNext, StartContext, StopContext } from "./base";
import CONSTANTS from "../constants";
import BROWSER from "../browser";

export const HYPERLINK_MIDDLEWARE_NAME = "app-hyperlink";

const HyperLinkMiddlewareFactory = (): Middleware => {
	let __ctrlPressed = false;
	const onKeyDownUp = (e: KeyboardEvent) => __ctrlPressed = e.ctrlKey;
	let onClick: (e: MouseEvent) => void | undefined;

	return {
		name: HYPERLINK_MIDDLEWARE_NAME,
		start: async (context: StartContext, next: MiddlewareNext) => {
			await next();

			BROWSER.window.addEventListener("click", onClick = (e: MouseEvent) => {
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

					if (elem === e.currentTarget)
						return;

					elem = elem.parentElement;
				}

				if (!elem || __ctrlPressed || elem.getAttribute("target") === "_blank")
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
				else
					throw "Not found url for navigation.";

				if (elem.classList.contains(CONSTANTS.LoadingElementClass))
					return;
				elem.classList.add(CONSTANTS.LoadingElementClass);

				context.app
					.nav({ 
						url, 
						replace: elem.hasAttribute(CONSTANTS.NavUrlReplaceAttributeName), 
						scope: elem.getAttribute(CONSTANTS.NavUrlScopeAttributeName),
						data: { clickElem: elem }
					})
					.catch(() => { })
					.finally(() => elem.classList.remove(CONSTANTS.LoadingElementClass));
			}, false);

			BROWSER.window.addEventListener("keydown", onKeyDownUp, false);
			BROWSER.window.addEventListener("keyup", onKeyDownUp, false);
		},
		stop: (_context: StopContext, next: MiddlewareNext) => {
			BROWSER.window.removeEventListener("click", onClick, false);
			BROWSER.window.removeEventListener("keydown", onKeyDownUp, false);
			BROWSER.window.removeEventListener("keyup", onKeyDownUp, false);

			return next();
		}
	};
};

export default HyperLinkMiddlewareFactory;