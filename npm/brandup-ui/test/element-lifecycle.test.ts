import { UIElement, UIElementBound, DOM, reactive, bind, bindEach, nextTick } from "../source/index";

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

// ─── helpers ──────────────────────────────────────────────────────────────────

class Widget extends UIElement {
	typeName = "widget";
	renderCallCount = 0;
	lastRenderElem?: HTMLElement;

	attach(elem: HTMLElement) { this.setElement(elem); }

	protected override _onRenderElement(elem: HTMLElement) {
		this.renderCallCount++;
		this.lastRenderElem = elem;
	}
}

class NamedWidget extends UIElementBound {
	destroyOrder: string[];
	constructor(label: string, elem: HTMLElement, destroyOrder: string[]) {
		super(label, elem);
		this.destroyOrder = destroyOrder;
		this.on("destroy", () => destroyOrder.push(label));
	}
}

// ─── setElement ───────────────────────────────────────────────────────────────

it("setElement binds the element and exposes it via the element getter", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	w.attach(elem);
	expect(w.element).toBe(elem);
});

it("setElement writes the typeName to the element's data attribute", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	w.attach(elem);
	expect(elem.dataset["uiElement"]).toBe("widget");
});

it("setElement sets the uielement property on the DOM node", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	w.attach(elem);
	expect((elem as any)["uielement"]).toBe(w);
});

it("setElement calls _onRenderElement with the bound element", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	w.attach(elem);
	expect(w.renderCallCount).toBe(1);
	expect(w.lastRenderElem).toBe(elem);
});

it("setElement fires the 'rendered' event with the UIElement as argument", () => {
	const w = new Widget();
	let sender: UIElement | undefined;
	w.on("rendered", s => { sender = s; });
	w.attach(document.createElement("div"));
	expect(sender).toBe(w);
});

it("setElement throws when called a second time", () => {
	const w = new Widget();
	w.attach(document.createElement("div"));
	expect(() => w.attach(document.createElement("div"))).toThrow();
});

it("setElement throws when the element already belongs to another UIElement", () => {
	const w1 = new Widget();
	const w2 = new Widget();
	const elem = document.createElement("div");
	w1.attach(elem);
	expect(() => w2.attach(elem)).toThrow();
});

it("UIElement.hasElement returns false before setElement and true after", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	expect(UIElement.hasElement(elem)).toBe(false);
	w.attach(elem);
	expect(UIElement.hasElement(elem)).toBe(true);
});

// ─── destroy: cleanup ─────────────────────────────────────────────────────────

it("destroy clears the element getter", () => {
	const w = new Widget();
	w.attach(document.createElement("div"));
	w.destroy();
	expect(w.element).toBeUndefined();
});

it("destroy removes the data attribute from the DOM element", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	w.attach(elem);
	w.destroy();
	expect(elem.dataset["uiElement"]).toBeUndefined();
});

it("destroy removes the uielement property from the DOM node", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	w.attach(elem);
	w.destroy();
	expect((elem as any)["uielement"]).toBeUndefined();
});

it("UIElement.hasElement returns false after destroy", () => {
	const w = new Widget();
	const elem = document.createElement("div");
	w.attach(elem);
	w.destroy();
	expect(UIElement.hasElement(elem)).toBe(false);
});

it("destroy fires the 'destroy' event", () => {
	const w = new Widget();
	w.attach(document.createElement("div"));
	let fired = false;
	w.on("destroy", () => { fired = true; });
	w.destroy();
	expect(fired).toBe(true);
});

it("destroy is idempotent — calling it twice does not throw", () => {
	const w = new Widget();
	w.attach(document.createElement("div"));
	w.destroy();
	expect(() => w.destroy()).not.toThrow();
});

it("destroy fires the destroy event only once even when called twice", () => {
	const w = new Widget();
	w.attach(document.createElement("div"));
	let count = 0;
	w.on("destroy", () => { count++; });
	w.destroy();
	w.destroy();
	expect(count).toBe(1);
});

// ─── destroy: reactive bindings ───────────────────────────────────────────────

it("destroy stops reactive bind() effects inside its element", async () => {
	const state = reactive({ n: 0 });
	let runs = 0;

	const elem = DOM.tag("div", null, bind(() => { runs++; return state.n; }));
	const w = new Widget();
	w.attach(elem);
	expect(runs).toBe(1);

	w.destroy();
	state.n = 1;
	await nextTick();
	expect(runs).toBe(1); // effect stopped
});

it("destroy stops bindEach effects inside its element", async () => {
	const state = reactive({ items: [{ id: 1 }] });
	let reconciles = 0;

	const elem = DOM.tag("ul", null,
		bindEach(() => { reconciles++; return state.items; }, i => i.id, _ => DOM.tag("li"))
	);
	const w = new Widget();
	w.attach(elem);
	expect(reconciles).toBe(1);

	w.destroy();
	state.items.push({ id: 2 });
	await nextTick();
	expect(reconciles).toBe(1);
});

// ─── destroy: cascade ─────────────────────────────────────────────────────────

it("destroy cascades to a directly nested UIElement", () => {
	const parentElem = document.createElement("div");
	const childElem = document.createElement("span");
	parentElem.appendChild(childElem);

	const parent = new Widget();
	const child = new Widget();
	parent.attach(parentElem);
	child.attach(childElem);

	parent.destroy();
	expect(child.element).toBeUndefined();
});

it("destroy cascades to a grandchild UIElement", () => {
	const parentElem = document.createElement("div");
	const childElem = document.createElement("section");
	const grandchildElem = document.createElement("span");
	parentElem.appendChild(childElem);
	childElem.appendChild(grandchildElem);

	const parent = new Widget();
	const child = new Widget();
	const grandchild = new Widget();
	parent.attach(parentElem);
	child.attach(childElem);
	grandchild.attach(grandchildElem);

	parent.destroy();
	expect(child.element).toBeUndefined();
	expect(grandchild.element).toBeUndefined();
});

it("destroy cascades in deepest-first order", () => {
	const order: string[] = [];
	const parentElem = document.createElement("div");
	const childElem = document.createElement("section");
	const grandchildElem = document.createElement("span");
	parentElem.appendChild(childElem);
	childElem.appendChild(grandchildElem);

	const parent = new NamedWidget("parent", parentElem, order);
	new NamedWidget("child", childElem, order);
	new NamedWidget("grandchild", grandchildElem, order);

	parent.destroy();
	// parent fires its own event first, then cascades deepest-first
	expect(order).toEqual(["parent", "grandchild", "child"]);
});

it("destroy does not re-destroy already-destroyed nested UIElements", () => {
	const parentElem = document.createElement("div");
	const childElem = document.createElement("span");
	parentElem.appendChild(childElem);

	const parent = new Widget();
	const child = new Widget();
	parent.attach(parentElem);
	child.attach(childElem);

	let childDestroyCount = 0;
	child.on("destroy", () => { childDestroyCount++; });

	parent.destroy(); // cascades to child
	expect(childDestroyCount).toBe(1);
});

it("destroy stops bindings of nested UIElements", async () => {
	const state = reactive({ n: 0 });
	let runs = 0;

	const childElem = DOM.tag("span", null, bind(() => { runs++; return state.n; }));
	const parentElem = DOM.tag("div", null, childElem);

	const parent = new Widget();
	const child = new Widget();
	parent.attach(parentElem);
	child.attach(childElem);
	expect(runs).toBe(1);

	parent.destroy(); // cascades, child's bindings must stop
	state.n = 1;
	await nextTick();
	expect(runs).toBe(1);
});

// ─── auto-destroy on DOM removal ──────────────────────────────────────────────

it("removing a mounted element from the document auto-destroys its UIElement", async () => {
	document.body.innerHTML = "";
	const elem = document.createElement("div");
	const w = new Widget();
	w.attach(elem);

	document.body.appendChild(elem);
	await flush(); // MutationObserver marks as mounted

	expect(w.element).toBe(elem);
	elem.remove();
	await flush(); // MutationObserver fires destroy

	expect(w.element).toBeUndefined();
	document.body.innerHTML = "";
});

it("removing a mounted parent auto-destroys nested UIElements", async () => {
	document.body.innerHTML = "";

	const parentElem = document.createElement("div");
	const childElem = document.createElement("span");
	parentElem.appendChild(childElem);

	const parent = new Widget();
	const child = new Widget();
	parent.attach(parentElem);
	child.attach(childElem);

	document.body.appendChild(parentElem);
	await flush();

	parentElem.remove();
	await flush();

	expect(parent.element).toBeUndefined();
	expect(child.element).toBeUndefined();
	document.body.innerHTML = "";
});

it("UIElement is not auto-destroyed if its element was never in the document", async () => {
	const elem = document.createElement("div");
	const w = new Widget();
	w.attach(elem);

	// never append to document — just remove from a detached subtree
	const wrapper = document.createElement("div");
	wrapper.appendChild(elem);
	wrapper.removeChild(elem);
	await flush();

	expect(w.element).toBe(elem); // must NOT have been destroyed
});

it("explicit destroy prevents a later DOM removal from calling destroy again", async () => {
	document.body.innerHTML = "";
	const elem = document.createElement("div");
	const w = new Widget();
	w.attach(elem);

	document.body.appendChild(elem);
	await flush();

	let destroyCount = 0;
	w.on("destroy", () => { destroyCount++; });

	w.destroy(); // explicit
	elem.remove();
	await flush(); // should not trigger a second destroy

	expect(destroyCount).toBe(1);
	document.body.innerHTML = "";
});
