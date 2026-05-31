import { DOM, reactive, bind, computed, effectScope, nextTick, UIElementBound } from "../source/index";

// flush microtasks + MutationObserver callbacks (DOM-removal auto-dispose)
const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

it("DOM.tag bind renders synchronously and updates text on the next tick", async () => {
	const state = reactive({ name: "Alice" });

	const el = DOM.tag("div", null, "Hi, ", bind(() => state.name), "!");
	expect(el.textContent).toEqual("Hi, Alice!"); // initial render is synchronous

	state.name = "Bob";
	await nextTick();
	expect(el.textContent).toEqual("Hi, Bob!");
});

it("DOM.tag bind reuses the same text node across updates", async () => {
	const state = reactive({ n: 1 });
	const el = DOM.tag("div", null, bind(() => state.n));

	const node = el.firstChild;
	state.n = 2;
	await nextTick();
	expect(el.textContent).toEqual("2");
	expect(el.firstChild).toBe(node); // same text node, updated in place
});

it("DOM.tag bind renders text safely (not as HTML)", () => {
	const state = reactive({ html: "<b>x</b>" });
	const el = DOM.tag("div", null, bind(() => state.html));

	expect(el.querySelector("b")).toBeNull();      // not parsed as HTML
	expect(el.textContent).toEqual("<b>x</b>");
});

it("DOM.tag bind with a falsy value renders nothing", async () => {
	const state = reactive({ show: false, label: "X" });
	const el = DOM.tag("div", null, bind(() => state.show && state.label));
	expect(el.textContent).toEqual("");

	state.show = true;
	await nextTick();
	expect(el.textContent).toEqual("X");
});

it("DOM.tag bind swaps elements when an element is returned", async () => {
	const state = reactive({ on: true });
	const el = DOM.tag("div", null, bind(() => state.on ? DOM.tag("span", null, "on") : DOM.tag("b", null, "off")));

	expect(el.querySelector("span")).not.toBeNull();
	expect(el.querySelector("b")).toBeNull();

	state.on = false;
	await nextTick();
	expect(el.querySelector("span")).toBeNull();
	expect(el.querySelector("b")).not.toBeNull();
});

it("DOM.tag bind works with computed", async () => {
	const state = reactive({ first: "Ada", last: "Lovelace" });
	const full = computed(() => `${state.first} ${state.last}`);
	const el = DOM.tag("div", null, bind(() => full.value));

	expect(el.textContent).toEqual("Ada Lovelace");
	state.last = "Byron";
	await nextTick();
	expect(el.textContent).toEqual("Ada Byron");
});

it("effectScope stops tag bindings", async () => {
	const state = reactive({ name: "Alice" });
	const scope = effectScope();

	const el = scope.run(() => DOM.tag("div", null, bind(() => state.name)));
	expect(el.textContent).toEqual("Alice");

	state.name = "Bob";
	await nextTick();
	expect(el.textContent).toEqual("Bob");

	scope.stop();
	state.name = "Carol";
	await nextTick();
	expect(el.textContent).toEqual("Bob"); // binding effect stopped
});

it("a binding auto-disposes when its node is removed from the document", async () => {
	document.body.innerHTML = "";
	const state = reactive({ n: 0 });
	let runs = 0;

	const el = DOM.tag("div", null, bind(() => { runs++; return state.n; }));
	document.body.appendChild(el);
	await flush(); // observer marks it mounted
	expect(runs).toEqual(1);

	state.n = 1;
	await nextTick();
	expect(runs).toEqual(2);

	el.remove();
	await flush(); // observer disposes the effect

	state.n = 2;
	await nextTick();
	expect(runs).toEqual(2); // not re-run after removal

	document.body.innerHTML = "";
});

it("UIElement.destroy automatically stops bindings inside its element", async () => {
	const state = reactive({ name: "Alice" });

	// no effectScope used — destroy must dispose the subtree's bindings
	class Widget extends UIElementBound {
		constructor() {
			super("widget", DOM.tag("div", null, bind(() => state.name)));
		}
	}

	const w = new Widget();
	const el = w.element; // capture before destroy
	expect(el.textContent).toEqual("Alice");

	state.name = "Bob";
	await nextTick();
	expect(el.textContent).toEqual("Bob");

	w.destroy();
	state.name = "Carol";
	await nextTick();
	expect(el.textContent).toEqual("Bob"); // binding stopped automatically on destroy
});

it("UIElement.effectScope stops its bindings when the element is destroyed", async () => {
	const state = reactive({ name: "Alice" });

	class Widget extends UIElementBound {
		constructor() {
			const root = DOM.tag("div");
			super("widget", root);
			this.effectScope().run(() => {
				root.append(DOM.tag("span", null, bind(() => state.name)));
			});
		}
	}

	const w = new Widget();
	const el = w.element; // capture before destroy
	expect(el.textContent).toEqual("Alice");

	state.name = "Bob";
	await nextTick();
	expect(el.textContent).toEqual("Bob");

	w.destroy();
	state.name = "Carol";
	await nextTick();
	expect(el.textContent).toEqual("Bob"); // scope stopped on destroy
});
