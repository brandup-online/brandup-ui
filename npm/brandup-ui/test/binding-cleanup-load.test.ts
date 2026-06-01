import { DOM, bind, reactive, nextTick, UIElementBound } from "../source/index";
import { __bindingCleanupStats } from "../source/dom/binding-cleanup";

// flush microtasks + MutationObserver callbacks (DOM-removal auto-dispose)
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

class Widget extends UIElementBound {
	constructor(elem: HTMLElement) { super("w", elem); }
}

// Builds N standalone reactive bindings and N UIElements under `host` (2N tracked entries).
const populate = (host: HTMLElement, n: number, state: { x: number }) => {
	for (let i = 0; i < n; i++) {
		host.appendChild(DOM.tag("div", bind(() => state.x)));   // binding container
		const wEl = DOM.tag("div");
		host.appendChild(wEl);
		new Widget(wEl);                                          // UIElement
	}
};

afterEach(() => { document.body.innerHTML = ""; });

it("option 1: inserting nodes does no disposal work, however many are tracked", async () => {
	const N = 800;
	const state = reactive({ x: 0 });
	const host = DOM.tag("div");
	document.body.appendChild(host);

	populate(host, N, state); // 1600 tracked entries
	await flush();             // observer processes the insertions (must be ignored)

	__bindingCleanupStats.examined = 0;

	// pure insertions: append 500 fresh nodes — nothing is ever disconnected
	for (let i = 0; i < 500; i++)
		host.appendChild(DOM.tag("div", "static"));
	await flush();

	// the observer fires for the additions but examines zero tracked candidates
	expect(__bindingCleanupStats.examined).toBe(0);

	// and nothing was disposed: a live binding still updates
	const probe = host.firstElementChild as HTMLElement; // a bind() container
	const before = probe.textContent;
	state.x = 1;
	await nextTick();
	expect(probe.textContent).not.toEqual(before);
	expect(probe.textContent).toEqual("1");
});

it("option 2: removal work is proportional to the removed subtree, not the total tracked", async () => {
	const N = 800;
	const state = reactive({ x: 0 });
	const host = DOM.tag("div");
	document.body.appendChild(host);

	populate(host, N, state); // 1600 tracked entries live in the document
	await flush();

	// a small group: one standalone binding + one UIElement
	const bindingEl = DOM.tag("div", bind(() => state.x));
	const widgetEl = DOM.tag("div");
	const widget = new Widget(widgetEl);
	const group = DOM.tag("div", bindingEl, widgetEl);
	host.appendChild(group);
	await flush();

	expect(widget.element).toBe(widgetEl); // mounted UIElement

	__bindingCleanupStats.examined = 0;
	group.remove();
	await flush();

	// work touched only the 2 tracked entries inside the removed group — NOT the 1600 total
	expect(__bindingCleanupStats.examined).toBeGreaterThan(0);
	expect(__bindingCleanupStats.examined).toBeLessThan(10);
	expect(__bindingCleanupStats.examined).toBeLessThan(N); // crucially independent of N

	// the removed group was actually disposed...
	expect(widget.element).toBeUndefined();     // UIElement auto-destroyed
	const bindingText = bindingEl.textContent;
	state.x = 5;
	await nextTick();
	expect(bindingEl.textContent).toEqual(bindingText); // binding stopped (frozen)

	// ...while every untouched unit still works
	const survivor = host.firstElementChild as HTMLElement; // a live bind() container
	expect(survivor.textContent).toEqual("5");  // still reactive
});
