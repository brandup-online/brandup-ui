import { DOM } from "@brandup/ui";
import { ApplicationBuilder } from "../source/builder";
import { Middleware, MiddlewareNext, NavigateContext, StopContext } from "../source/middlewares/base";
import { Page, PageHashAction, PageHashChangedEvent, PAGE_HASHCHANGE_EVENT } from "../source/page";

// A minimal concrete page for the slot tests (rendering/hash are exercised elsewhere).
class TestPage extends Page {
	get typeName() { return "test-page"; }
	constructor() { super({ hash: null, current: undefined } as NavigateContext); }
}

// A page that captures onChangedHash calls and is rendered (has an element).
class HashPage extends Page {
	readonly calls: Array<[string | null, string | null, PageHashAction]> = [];
	get typeName() { return "hash-page"; }
	constructor(context: NavigateContext) {
		super(context);
		this.setElement(document.createElement("div"));
	}
	protected override async onChangedHash(newHash: string | null, oldHash: string | null, action: PageHashAction) {
		this.calls.push([newHash, oldHash, action]);
	}
}

const ctx = (hash: string | null, prevHash: string | null = null) =>
	({ hash, current: { hash: prevHash } }) as NavigateContext;

const setLocation = (url: string) => { window.location.href = url; };

async function runApp(middleware?: Middleware) {
	setLocation("http://localhost/");

	const builder = new ApplicationBuilder({});
	if (middleware)
		builder.useMiddleware(() => middleware);

	const app = builder.build({ basePath: "/" });
	await app.run({}, DOM.tag("div"));

	return app;
}

it("page: app.page is null before any page is set", async () => {
	const app = await runApp();

	expect(app.page).toBeNull();

	await app.destroy();
});

it("page: setPage exposes the page via app.page and null clears it", async () => {
	const app = await runApp();
	const page: Page = new TestPage();

	app.setPage(page);
	expect(app.page).toBe(page);

	app.setPage(null);
	expect(app.page).toBeNull();

	await app.destroy();
});

it("page: destroy clears app.page", async () => {
	const app = await runApp();
	app.setPage(new TestPage());

	await app.destroy();

	expect(app.page).toBeNull();
});

it("page: the stop middleware can still read app.page, which is cleared afterwards", async () => {
	let pageAtStop: Page | null | undefined;
	const page: Page = new TestPage();

	const middleware: Middleware = {
		name: "page-test",
		stop: async (context: StopContext, next: MiddlewareNext) => {
			pageAtStop = context.app.page; // app.page must still be available during "stop"
			await next();
		}
	};

	const app = await runApp(middleware);
	app.setPage(page);

	await app.destroy();

	expect(pageAtStop).toBe(page);
	expect(app.page).toBeNull();
});

// ── hash changes ─────────────────────────────────────────────────────────────────

it("page: __changedHash notifies onChangedHash and raises the hashchange event", async () => {
	const page = new HashPage(ctx(null)); // starts with no hash

	const events: PageHashChangedEvent[] = [];
	page.on(PAGE_HASHCHANGE_EVENT, (e: PageHashChangedEvent) => events.push(e));

	await page.__changedHash(ctx("section", null)); // null -> "section"

	expect(page.calls).toEqual([["section", null, "add"]]);
	expect(events).toEqual([{ page, prev: null, new: "section", action: "add" }]);
});

it("page: __changedHash is a no-op when neither the new nor previous hash is set", async () => {
	const page = new HashPage(ctx(null));

	const events: PageHashChangedEvent[] = [];
	page.on(PAGE_HASHCHANGE_EVENT, (e: PageHashChangedEvent) => events.push(e));

	await page.__changedHash(ctx(null, null));

	expect(page.calls).toEqual([]);
	expect(events).toEqual([]);
});

it("page: __changedHash reports the remove action when a hash is cleared", async () => {
	const page = new HashPage(ctx("section"));

	await page.__changedHash(ctx(null, "section")); // "section" -> null

	expect(page.calls).toEqual([[null, "section", "remove"]]);
});
