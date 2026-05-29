import StateMiddlewareFactory from "../../source/middlewares/state";
import CONSTANTS from "../../source/constants";
import { InvokeContext } from "../../source/middlewares/base";

const makeContext = (element: HTMLElement): InvokeContext => ({
	app: { element } as any,
	data: {},
	abort: new AbortController().signal
});

it("State middleware shows app loading during submit and clears it after", async () => {
	const mw = StateMiddlewareFactory();
	const element = document.createElement("div");
	const context = makeContext(element);

	let loadingDuringSubmit = false;
	await mw.submit!(context as any, async () => {
		// state middleware wraps the chain, so begin() must have run before next()
		loadingDuringSubmit = element.classList.contains(CONSTANTS.STATE_CLASS.LOADING);
	});

	expect(loadingDuringSubmit).toBe(true);
	expect(element.classList.contains(CONSTANTS.STATE_CLASS.LOADED)).toBe(true);
	expect(element.classList.contains(CONSTANTS.STATE_CLASS.LOADING)).toBe(false);
});

it("State middleware submit is counter-balanced (no premature clear)", async () => {
	const mw = StateMiddlewareFactory();
	const element = document.createElement("div");
	const context = makeContext(element);

	// a navigation in flight holds the loading state
	let navInFlight!: () => void;
	const navPromise = mw.navigate!(context as any, () => new Promise<void>(resolve => { navInFlight = resolve; }));

	expect(element.classList.contains(CONSTANTS.STATE_CLASS.LOADING)).toBe(true);

	// a submit overlaps the navigation, then completes first
	await mw.submit!(context as any, async () => { });

	// submit must NOT clear loading while the navigation is still running
	expect(element.classList.contains(CONSTANTS.STATE_CLASS.LOADING)).toBe(true);
	expect(element.classList.contains(CONSTANTS.STATE_CLASS.LOADED)).toBe(false);

	// finishing the navigation clears it
	navInFlight();
	await navPromise;

	expect(element.classList.contains(CONSTANTS.STATE_CLASS.LOADED)).toBe(true);
	expect(element.classList.contains(CONSTANTS.STATE_CLASS.LOADING)).toBe(false);
});
