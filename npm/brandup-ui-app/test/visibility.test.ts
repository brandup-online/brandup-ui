import { DOM } from "@brandup/ui";
import { ApplicationBuilder } from "../source/builder";
import { Middleware, VisibilityContext } from "../source/middlewares/base";

// document.hidden / visibilityState are read-only getters in jsdom; shadow them with a
// mutable backing value so tests can drive the Page Visibility state.
let hiddenValue = false;

beforeAll(() => {
	Object.defineProperty(document, "hidden", { configurable: true, get: () => hiddenValue });
	Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hiddenValue ? "hidden" : "visible") });
});

afterAll(() => {
	delete (document as any).hidden;
	delete (document as any).visibilityState;
});

beforeEach(() => { hiddenValue = false; });

const setLocation = (url: string) => { window.location.href = url; };
const visibilitychange = () => document.dispatchEvent(new Event("visibilitychange"));
const pagehide = () => window.dispatchEvent(new Event("pagehide"));
const pageshow = () => window.dispatchEvent(new Event("pageshow"));
// visibility runs through the async middleware chain (fire-and-forget); flush it.
const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

async function runApp(record: (ctx: VisibilityContext) => void) {
	setLocation("http://localhost/");

	const builder = new ApplicationBuilder({});
	builder.useMiddleware(() => <Middleware>{
		name: "visibility-test",
		visibility: async (ctx: VisibilityContext, next) => {
			record(ctx);
			await next();
		}
	});

	const app = builder.build({ basePath: "/" });
	const appElem = DOM.tag("div");
	document.body.appendChild(appElem);
	await app.run({}, appElem);

	return { app, appElem };
}

it("visibility: fires with visible=false then true on visibilitychange", async () => {
	const calls: boolean[] = [];
	const { app, appElem } = await runApp(ctx => calls.push(ctx.visible));

	hiddenValue = true; visibilitychange(); await tick();
	hiddenValue = false; visibilitychange(); await tick();

	expect(calls).toEqual([false, true]);

	await app.destroy();
	appElem.remove();
});

it("visibility: pagehide fires false and pageshow fires true (bfcache)", async () => {
	const calls: boolean[] = [];
	const { app, appElem } = await runApp(ctx => calls.push(ctx.visible));

	pagehide(); await tick(); // leaving — page persisted into bfcache
	pageshow(); await tick(); // restored from bfcache

	expect(calls).toEqual([false, true]);

	await app.destroy();
	appElem.remove();
});

it("visibility: deduplicates a transition reported by multiple events", async () => {
	const calls: boolean[] = [];
	const { app, appElem } = await runApp(ctx => calls.push(ctx.visible));

	// pagehide and visibilitychange both report "hidden" — must collapse to one call
	pagehide();
	hiddenValue = true; visibilitychange();
	await tick();

	expect(calls).toEqual([false]);

	await app.destroy();
	appElem.remove();
});

it("visibility: a redundant pageshow while already visible does not fire", async () => {
	const calls: boolean[] = [];
	const { app, appElem } = await runApp(ctx => calls.push(ctx.visible));

	// the page is already visible since run(); an initial/extra pageshow is a no-op
	pageshow(); await tick();

	expect(calls).toEqual([]);

	await app.destroy();
	appElem.remove();
});

it("visibility: context carries app, abort signal and the visible flag", async () => {
	const seen: VisibilityContext[] = [];
	const { app, appElem } = await runApp(ctx => seen.push(ctx));

	hiddenValue = true; visibilitychange(); await tick();

	expect(seen).toHaveLength(1);
	expect(seen[0].app).toBe(app);
	expect(seen[0].abort).toBe(app.abort);
	expect(seen[0].visible).toBe(false);

	await app.destroy();
	appElem.remove();
});

it("visibility listeners are removed on destroy", async () => {
	const calls: boolean[] = [];
	const { app, appElem } = await runApp(ctx => calls.push(ctx.visible));

	hiddenValue = true; visibilitychange(); await tick();
	expect(calls).toEqual([false]);

	await app.destroy();
	calls.length = 0;

	// none of these must reach the (now detached) handlers
	hiddenValue = false; visibilitychange();
	pageshow();
	pagehide();
	await tick();

	expect(calls).toEqual([]);

	appElem.remove();
});
