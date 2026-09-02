import { Middleware, MiddlewareNext, NavigateContext, StartContext, StopContext } from "./base";

/** Unique name of the built-in history middleware. */
export const HISTORY_MIDDLEWARE_NAME = "app-history";

/** Key under which the history middleware stores its data inside `history.state`. */
const STATE_KEY = "bp-history";
/** Default throttle for persisting the scroll position, in milliseconds. */
const DEFAULT_SCROLL_THROTTLE = 150;

/** Options for {@link HistoryMiddleware}. */
export interface HistoryOptions {
	/**
	 * Persist the scroll position into each history entry (throttled) and restore it on
	 * back/forward navigation. Off by default. Pass `{ throttleMs }` to tune the save rate.
	 */
	scrollRestoration?: boolean | { throttleMs?: number };
}

/** Per-entry data the middleware keeps in `history.state[STATE_KEY]`. */
interface HistoryEntryState {
	navId: string;
	scroll?: { x: number; y: number };
}

/**
 * Create the built-in history middleware that syncs the browser address bar with navigations:
 * it pushes or replaces a `history` entry (with scroll-to-top on push) once a navigation has
 * completed successfully, and — when {@link HistoryOptions.scrollRestoration} is enabled —
 * persists and restores the scroll position across entries.
 *
 * Opt-in — register it explicitly, before any page-rendering middleware, so the URL changes
 * only after the new page is in place:
 *
 * ```TypeScript
 * builder.useMiddleware(HistoryMiddleware);                          // basic
 * builder.useMiddleware(HistoryMiddleware, { scrollRestoration: true }); // + scroll memory
 * ```
 *
 * Dependency-free (History API only); it does not manage `document.title` — a page-level concern.
 *
 * @param options History behaviour options.
 * @returns The history middleware instance.
 */
const HistoryMiddlewareFactory = (options?: HistoryOptions): Middleware => {
	const scrollOpt = options?.scrollRestoration;
	const scrollEnabled = !!scrollOpt;
	const throttleMs = (typeof scrollOpt === "object" && scrollOpt.throttleMs) || DEFAULT_SCROLL_THROTTLE;

	let currentNavId: string | undefined; // id of the entry owned by the latest navigation
	let onScroll: (() => void) | undefined;

	const readEntry = (): HistoryEntryState | undefined => window.history.state?.[STATE_KEY];

	const writeEntry = (entry: HistoryEntryState, url?: string, replace = true) => {
		const fullState = { ...(window.history.state ?? {}), [STATE_KEY]: entry };
		if (replace)
			window.history.replaceState(fullState, "", url);
		else
			window.history.pushState(fullState, "", url);
	};

	const syncHistory = (context: NavigateContext) => {
		// External targets are not our entries to push.
		if (context.external)
			return;

		currentNavId = context.id;

		let url = context.url;
		if (context.hash)
			url += "#" + context.hash;

		// Carry the scroll of the entry we keep (replace); a brand-new entry (push) starts fresh.
		const prevScroll = readEntry()?.scroll;

		if (context.source === "first") {
			writeEntry({ navId: context.id, scroll: prevScroll }, url, true);
			return;
		}

		let replace = context.replace;
		let skipScroll = false;

		// Back/forward, or a navigation that did not change the url, just updates the entry.
		if (context.data.popstate !== undefined || context.action === "url-no-change")
			replace = true;

		// A changed scope (or coming straight off the first navigation) is a fresh entry; a scope
		// change also suppresses the scroll-to-top.
		if (context.current?.scope !== context.scope || context.current?.source === "first") {
			replace = false;
			if (context.current?.scope !== context.scope)
				skipScroll = true;
		}

		writeEntry({ navId: context.id, scroll: replace ? prevScroll : undefined }, url, replace);

		// Restore the saved position on back/forward; otherwise scroll to top.
		if (scrollEnabled && context.data.popstate !== undefined) {
			const saved = (context.data.popstate as Record<string, any> | null)?.[STATE_KEY]?.scroll as HistoryEntryState["scroll"];
			if (saved) {
				window.scroll(saved.x, saved.y);
				return;
			}
		}

		// Scroll to top on a fresh entry, or on a link click that did not change the url.
		const scrollToTop = (!replace && !skipScroll && context.action !== "hash")
			|| (context.action === "url-no-change" && !!context.clickElem);
		if (scrollToTop)
			window.scrollTo({ left: 0, top: 0, behavior: "auto" });
	};

	const middleware: Middleware = {
		name: HISTORY_MIDDLEWARE_NAME,
		navigate: async (context: NavigateContext, next: MiddlewareNext) => {
			// Run downstream first: a redirect/abort throws out of next() and must leave the
			// address bar untouched. The URL is synced only when the navigation succeeds.
			await next();

			syncHistory(context);
		}
	};

	if (scrollEnabled) {
		middleware.start = async (_context: StartContext, next: MiddlewareNext) => {
			await next();

			let scheduled = false;
			const save = () => {
				scheduled = false;

				const entry = readEntry();
				// Only persist into the entry that belongs to the current navigation.
				if (!entry || entry.navId !== currentNavId)
					return;

				writeEntry({ ...entry, scroll: { x: window.scrollX, y: window.scrollY } });
			};

			// Throttle: at most one replaceState per throttle window; position read when it fires.
			onScroll = () => {
				if (scheduled)
					return;
				scheduled = true;
				window.setTimeout(save, throttleMs);
			};
			window.addEventListener("scroll", onScroll, { passive: true });
		};

		middleware.stop = async (_context: StopContext, next: MiddlewareNext) => {
			if (onScroll)
				window.removeEventListener("scroll", onScroll);

			await next();
		};
	}

	return middleware;
};

export default HistoryMiddlewareFactory;
