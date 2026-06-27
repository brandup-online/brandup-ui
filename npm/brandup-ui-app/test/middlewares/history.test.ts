import { DOM } from "@brandup/ui";
import { ApplicationBuilder } from "../../source/builder";
import HistoryMiddleware, { HistoryOptions } from "../../source/middlewares/history";

const STATE_KEY = "bp-history";

const setLocation = (url: string) => { window.location.href = url; };
const navState = () => (window.history.state as any)?.[STATE_KEY];
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

// History syncs the global History API, so the app element does not need to be in the document.
function buildApp(options?: HistoryOptions) {
	setLocation("http://localhost/");

	const builder = new ApplicationBuilder({});
	builder.useMiddleware(HistoryMiddleware, options);

	return builder.build({ basePath: "/" });
}

// jsdom's window.scrollTo is a not-implemented stub; replace it so we can assert calls.
let scrollSpy: jest.SpyInstance;
// jest-location-mock proxies window.history, which makes jest.spyOn call counts unreliable;
// record push/replace by wrapping the methods directly instead.
let restoreHistory: (() => void) | null = null;

beforeEach(() => { scrollSpy = jest.spyOn(window, "scrollTo").mockImplementation(() => { }); });
afterEach(() => {
	restoreHistory?.();
	restoreHistory = null;
	scrollSpy.mockRestore();
});

function recordHistory() {
	const calls: Array<{ type: "push" | "replace"; url: string }> = [];

	const realPush = window.history.pushState.bind(window.history);
	const realReplace = window.history.replaceState.bind(window.history);

	window.history.pushState = ((state: any, title: string, url?: string | null) => {
		calls.push({ type: "push", url: String(url) });
		return realPush(state, title, url);
	}) as typeof window.history.pushState;
	window.history.replaceState = ((state: any, title: string, url?: string | null) => {
		calls.push({ type: "replace", url: String(url) });
		return realReplace(state, title, url);
	}) as typeof window.history.replaceState;

	restoreHistory = () => {
		window.history.pushState = realPush;
		window.history.replaceState = realReplace;
	};

	return calls;
}

it("history: a normal navigation pushes a new entry, scrolls to top and tags the state", async () => {
	const app = buildApp();
	await app.run({}, DOM.tag("div"));

	const calls = recordHistory();
	scrollSpy.mockClear();

	await app.nav("/about");

	expect(calls.map(c => c.type)).toEqual(["push"]);
	expect(scrollSpy).toHaveBeenCalled();
	expect(window.location.href).toEqual("http://localhost/about");
	expect(navState()?.navId).toBeDefined();

	await app.destroy();
});

it("history: the first navigation replaces instead of pushing", async () => {
	const calls = recordHistory(); // record from before run() so the first navigation is captured

	const app = buildApp();
	await app.run({}, DOM.tag("div"));

	expect(calls.map(c => c.type)).toEqual(["replace"]);

	await app.destroy();
});

it("history: nav with replace=true uses replaceState and does not scroll", async () => {
	const app = buildApp();
	await app.run({}, DOM.tag("div"));
	await app.nav("/about"); // move past the first navigation

	const calls = recordHistory();
	scrollSpy.mockClear();

	await app.nav({ url: "/company", replace: true });

	expect(calls.map(c => c.type)).toEqual(["replace"]);
	expect(scrollSpy).not.toHaveBeenCalled();
	expect(window.location.href).toEqual("http://localhost/company");

	await app.destroy();
});

it("history: a hash-only navigation pushes without scrolling", async () => {
	const app = buildApp();
	await app.run({}, DOM.tag("div"));
	await app.nav("/about");

	const calls = recordHistory();
	scrollSpy.mockClear();

	const navContext = await app.nav("/about#section");
	expect(navContext.action).toEqual("hash"); // guards the precondition

	expect(calls.map(c => c.type)).toEqual(["push"]);
	expect(scrollSpy).not.toHaveBeenCalled();
	expect(window.location.href).toContain("#section");

	await app.destroy();
});

it("history: an external navigation does not touch history", async () => {
	const app = buildApp();
	await app.run({}, DOM.tag("div"));
	await app.nav("/about");

	const calls = recordHistory();

	await app.nav("http://other.example/page").catch(() => { });

	expect(calls).toEqual([]);

	await app.destroy();
});

it("history: a same-url navigation replaces instead of pushing a duplicate entry", async () => {
	const app = buildApp();
	await app.run({}, DOM.tag("div"));
	await app.nav("/about");

	const calls = recordHistory();
	scrollSpy.mockClear();

	const navContext = await app.nav("/about");
	expect(navContext.action).toEqual("url-no-change"); // guards the precondition

	expect(calls.map(c => c.type)).toEqual(["replace"]);
	expect(scrollSpy).not.toHaveBeenCalled(); // no click origin → no scroll

	await app.destroy();
});

it("history: a same-url navigation from a link click scrolls to top", async () => {
	const app = buildApp();
	await app.run({}, DOM.tag("div"));
	await app.nav("/about");

	const calls = recordHistory();
	scrollSpy.mockClear();

	await app.nav({ url: "/about", clickElem: document.createElement("a") });

	expect(calls.map(c => c.type)).toEqual(["replace"]);
	expect(scrollSpy).toHaveBeenCalled(); // click on a same-url link scrolls to top

	await app.destroy();
});

it("history: a scope change pushes a fresh entry without scrolling", async () => {
	const app = buildApp();
	await app.run({}, DOM.tag("div"));
	await app.nav("/about");

	const calls = recordHistory();
	scrollSpy.mockClear();

	await app.nav({ url: "/section", scope: "panel" });

	expect(calls.map(c => c.type)).toEqual(["push"]);
	expect(scrollSpy).not.toHaveBeenCalled(); // a scope change suppresses scroll-to-top

	await app.destroy();
});

it("history scrollRestoration: restores the saved scroll position on back/forward", async () => {
	const scrollMock = jest.spyOn(window, "scroll").mockImplementation((() => { }) as any);
	try {
		const app = buildApp({ scrollRestoration: true });
		await app.run({}, DOM.tag("div"));

		window.dispatchEvent(new PopStateEvent("popstate", {
			state: { [STATE_KEY]: { navId: "x", scroll: { x: 5, y: 50 } } }
		}));
		await tick();

		expect(scrollMock).toHaveBeenCalledWith(5, 50);

		await app.destroy();
	}
	finally {
		scrollMock.mockRestore();
	}
});

it("history scrollRestoration: persists the scroll position into the current entry (throttled)", async () => {
	const app = buildApp({ scrollRestoration: true });
	await app.run({}, DOM.tag("div"));

	jest.useFakeTimers();
	Object.defineProperty(window, "scrollX", { value: 12, configurable: true });
	Object.defineProperty(window, "scrollY", { value: 34, configurable: true });
	try {
		window.dispatchEvent(new Event("scroll"));
		window.dispatchEvent(new Event("scroll")); // throttled to a single save
		jest.advanceTimersByTime(150);

		expect(navState()?.scroll).toEqual({ x: 12, y: 34 });
	}
	finally {
		jest.useRealTimers();
		delete (window as any).scrollX;
		delete (window as any).scrollY;
	}

	await app.destroy();
});
