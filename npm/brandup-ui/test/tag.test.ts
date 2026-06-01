import { DOM, bind, bindEach, reactive, nextTick, UIElement, UIElementBound } from "../source/index";

// ─── helpers ──────────────────────────────────────────────────────────────────

class Widget extends UIElementBound {
	constructor(elem: HTMLElement = DOM.tag("span")) {
		super("widget", elem);
	}
}

class DeferredWidget extends UIElement {
	typeName = "deferred";
	bind(elem: HTMLElement) { this.setElement(elem); }
}

// ─── tag name only ────────────────────────────────────────────────────────────

it("tag: tag name only creates an empty element", () => {
	const el = DOM.tag("div");
	expect(el.tagName).toBe("DIV");
	expect(el.innerHTML).toBe("");
	expect(el.className).toBe("");
});

it("tag: correct element type is returned", () => {
	expect(DOM.tag("ul")).toBeInstanceOf(HTMLUListElement);
	expect(DOM.tag("input")).toBeInstanceOf(HTMLInputElement);
	expect(DOM.tag("a")).toBeInstanceOf(HTMLAnchorElement);
});

// ─── null options ─────────────────────────────────────────────────────────────

it("tag: null options → no class, children follow", () => {
	const el = DOM.tag("div", null, "hello");
	expect(el.className).toBe("");
	expect(el.innerHTML).toBe("hello");
});

// ─── ElementOptions ───────────────────────────────────────────────────────────

it("tag: options.class string applies CSS class", () => {
	const el = DOM.tag("div", { class: "foo" });
	expect(el.classList.contains("foo")).toBe(true);
	expect(el.classList.length).toBe(1);
});

it("tag: options.class array applies multiple CSS classes", () => {
	const el = DOM.tag("div", { class: ["a", "b"] });
	expect(el.classList.contains("a")).toBe(true);
	expect(el.classList.contains("b")).toBe(true);
	expect(el.classList.length).toBe(2);
});

it("tag: options.id sets the id attribute", () => {
	const el = DOM.tag("div", { id: "main" });
	expect(el.id).toBe("main");
});

it("tag: options.command sets data-command attribute", () => {
	const el = DOM.tag("button", { command: "save" });
	expect(el.dataset.command).toBe("save");
});

it("tag: options.dataset sets data-* attributes", () => {
	const el = DOM.tag("div", { dataset: { foo: "bar", count: "3" } });
	expect(el.dataset.foo).toBe("bar");
	expect(el.dataset.count).toBe("3");
});

it("tag: options.styles applies inline styles", () => {
	const el = DOM.tag("div", { styles: { fontSize: "12px", color: "red" } });
	expect(el.style.fontSize).toBe("12px");
	expect(el.style.color).toBe("red");
});

it("tag: options.events attaches event listeners", () => {
	let clicked = false;
	const el = DOM.tag("button", { events: { click: () => { clicked = true; } } });
	el.click();
	expect(clicked).toBe(true);
});

it("tag: arbitrary string option sets plain attribute", () => {
	const el = DOM.tag("div", { role: "button", "aria-label": "close" });
	expect(el.getAttribute("role")).toBe("button");
	expect(el.getAttribute("aria-label")).toBe("close");
});

it("tag: null-valued option sets empty attribute", () => {
	const el = DOM.tag("div", { disabled: null });
	expect(el.getAttribute("disabled")).toBe("");
});

it("tag: numeric option is coerced to string attribute", () => {
	const el = DOM.tag("div", { tabindex: 0, count: 5 });
	expect(el.getAttribute("tabindex")).toBe("0");
	expect(el.getAttribute("count")).toBe("5");
});

it("tag: boolean option is coerced to string attribute", () => {
	const el = DOM.tag("div", { draggable: false });
	expect(el.getAttribute("draggable")).toBe("false");
});

it("tag: object option is JSON-stringified as attribute", () => {
	const el = DOM.tag("div", { config: { x: 1 } });
	expect(el.getAttribute("config")).toBe('{"x":1}');
});

it("tag: undefined option value is ignored", () => {
	const el = DOM.tag("div", { id: undefined });
	expect(el.hasAttribute("id")).toBe(false);
});

// ─── string / number / boolean as first child ─────────────────────────────────

it("tag: string second arg → HTML text child (not a CSS class)", () => {
	const el = DOM.tag("div", "hello");
	expect(el.innerHTML).toBe("hello");
	expect(el.className).toBe("");
});

it("tag: HTML string second arg is inserted as markup", () => {
	const el = DOM.tag("div", "<b>bold</b>");
	expect(el.querySelector("b")).not.toBeNull();
});

it("tag: number second arg → text child", () => {
	const el = DOM.tag("div", 42);
	expect(el.innerHTML).toBe("42");
});

it("tag: zero second arg → text child '0'", () => {
	const el = DOM.tag("div", 0);
	expect(el.innerHTML).toBe("0");
});

it("tag: boolean false second arg → empty child", () => {
	const el = DOM.tag("div", false);
	expect(el.innerHTML).toBe("false");
});

// ─── array as first child ─────────────────────────────────────────────────────

it("tag: string array second arg → HTML children (not CSS classes)", () => {
	const el = DOM.tag("div", ["<b>a</b>", "<i>b</i>"]);
	expect(el.querySelector("b")).not.toBeNull();
	expect(el.querySelector("i")).not.toBeNull();
	expect(el.className).toBe("");
});

it("tag: mixed array second arg → each child appended", () => {
	const span = DOM.tag("span");
	const el = DOM.tag("div", [span, "text", 1]);
	expect(el.firstElementChild).toBe(span);
	expect(el.innerHTML).toBe("<span></span>text1");
});

// ─── Element / UIElement as second arg ───────────────────────────────────────

it("tag: Element second arg → appended as child", () => {
	const span = DOM.tag("span");
	const el = DOM.tag("div", span);
	expect(el.firstElementChild).toBe(span);
});

it("tag: UIElement second arg → its element is appended", () => {
	const w = new Widget();
	const el = DOM.tag("div", w);
	expect(el.firstElementChild).toBe(w.element);
});

it("tag: deferred UIElement second arg → appended once bound", () => {
	const w = new DeferredWidget();
	const el = DOM.tag("div", w);
	expect(el.children.length).toBe(0);
	w.bind(DOM.tag("span"));
	expect(el.firstElementChild).toBe(w.element);
});

// ─── reactive children ────────────────────────────────────────────────────────

it("tag: bind() second arg → reactive text updates", async () => {
	const state = reactive({ x: "a" });
	const el = DOM.tag("div", bind(() => state.x));
	expect(el.textContent).toBe("a");
	state.x = "b";
	await nextTick();
	expect(el.textContent).toBe("b");
});

it("tag: bind() returning a deferred UIElement appends its element once bound", () => {
	const w = new DeferredWidget();
	const state = reactive({ view: w });
	const el = DOM.tag("div", bind(() => state.view));

	// element not bound yet → placeholder, nothing rendered
	expect(el.firstElementChild).toBeNull();

	w.bind(DOM.tag("span"));

	// once setElement raises "rendered", the binding swaps in the real element
	expect(el.firstElementChild).toBe(w.element);
});

it("tag: bindEach() second arg → keyed list", async () => {
	const state = reactive({ items: [{ id: 1, t: "x" }] });
	const el = DOM.tag("ul", bindEach(() => state.items, i => i.id, i => DOM.tag("li", i.t)));
	expect(el.querySelectorAll("li").length).toBe(1);
	state.items.push({ id: 2, t: "y" });
	await nextTick();
	expect(el.querySelectorAll("li").length).toBe(2);
});

// ─── Promise / function children ─────────────────────────────────────────────

it("tag: Promise second arg → appended on resolve", async () => {
	const p = Promise.resolve(DOM.tag("span"));
	const el = DOM.tag("div", p);
	await p;
	expect(el.firstElementChild?.tagName).toBe("SPAN");
});

it("tag: function second arg (factory) → called with container, return appended", () => {
	const el = DOM.tag("div", () => DOM.tag("b", "bold"));
	expect(el.querySelector("b")).not.toBeNull();
});

it("tag: function second arg mutates container directly → no return needed", () => {
	const el = DOM.tag("div", (container: HTMLElement) => { container.id = "x"; });
	expect(el.id).toBe("x");
});

// ─── options + children together ─────────────────────────────────────────────

it("tag: options object + multiple children", () => {
	const el = DOM.tag("div", { class: "box", id: "main" }, "a", DOM.tag("span"), "b");
	expect(el.id).toBe("main");
	expect(el.classList.contains("box")).toBe(true);
	expect(el.children.length).toBe(1);
});

it("tag: string first child + more children", () => {
	const el = DOM.tag("div", "hello ", DOM.tag("b", "world"));
	expect(el.querySelector("b")?.textContent).toBe("world");
});

it("tag: null/undefined children are ignored", () => {
	const el = DOM.tag("div", null, null, undefined);
	expect(el.innerHTML).toBe("");
});

// ─── nested arrays ────────────────────────────────────────────────────────────

it("tag: nested array child is recursively appended", () => {
	const el = DOM.tag("div", null, [DOM.tag("span"), [DOM.tag("b"), DOM.tag("i")]]);
	expect(el.querySelectorAll("span, b, i").length).toBe(3);
});

// ─── UIElement with array/factory children ────────────────────────────────────

it("tag: Widget children in array and factory function", () => {
	const many = DOM.tag("div", null,
		[new Widget(DOM.tag("b")), (_e: HTMLElement) => new Widget(DOM.tag("i"))]
	);
	expect(many.querySelector("b")).not.toBeNull();
	expect(many.querySelector("i")).not.toBeNull();
});
