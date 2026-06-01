import { DOM, reactive, bind, bindEach, nextTick } from "../source/index";

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

// ─── initial render ───────────────────────────────────────────────────────────

it("bindEach renders initial list synchronously", () => {
	const state = reactive({ items: [{ id: 1, text: "a" }, { id: 2, text: "b" }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	expect(list.querySelectorAll("li").length).toBe(2);
	expect(list.querySelectorAll("li")[0].textContent).toBe("a");
	expect(list.querySelectorAll("li")[1].textContent).toBe("b");
});

it("bindEach renders an empty list with no items", () => {
	const state = reactive({ items: [] as { id: number }[] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, _ => DOM.tag("li"))
	);
	expect(list.querySelectorAll("li").length).toBe(0);
});

// ─── mutations ────────────────────────────────────────────────────────────────

it("bindEach push appends a new node", async () => {
	const state = reactive({ items: [{ id: 1, text: "a" }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	state.items.push({ id: 2, text: "b" });
	await nextTick();
	expect(list.querySelectorAll("li").length).toBe(2);
	expect(list.querySelectorAll("li")[1].textContent).toBe("b");
});

it("bindEach unshift prepends a new node", async () => {
	const state = reactive({ items: [{ id: 1, text: "b" }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	state.items.unshift({ id: 2, text: "a" });
	await nextTick();
	expect(list.querySelectorAll("li")[0].textContent).toBe("a");
	expect(list.querySelectorAll("li")[1].textContent).toBe("b");
});

it("bindEach splice removes a node at the given position", async () => {
	const state = reactive({ items: [{ id: 1, text: "a" }, { id: 2, text: "b" }, { id: 3, text: "c" }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	state.items.splice(1, 1); // remove "b"
	await nextTick();
	expect(list.querySelectorAll("li").length).toBe(2);
	expect(Array.from(list.querySelectorAll("li")).map(n => n.textContent)).toEqual(["a", "c"]);
});

it("bindEach full reassignment replaces all nodes", async () => {
	const state = reactive({ items: [{ id: 1, text: "a" }, { id: 2, text: "b" }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	const oldFirst = list.querySelectorAll("li")[0];
	state.items = [{ id: 3, text: "c" }];
	await nextTick();
	expect(list.querySelectorAll("li").length).toBe(1);
	expect(list.querySelectorAll("li")[0].textContent).toBe("c");
	expect(list.querySelectorAll("li")[0]).not.toBe(oldFirst);
});

it("bindEach clears all nodes when reassigned to empty array", async () => {
	const state = reactive({ items: [{ id: 1 }, { id: 2 }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, _ => DOM.tag("li"))
	);
	state.items = [];
	await nextTick();
	expect(list.querySelectorAll("li").length).toBe(0);
});

it("bindEach empty → items adds nodes correctly", async () => {
	const state = reactive({ items: [] as { id: number; text: string }[] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	state.items.push({ id: 1, text: "x" }, { id: 2, text: "y" });
	await nextTick();
	expect(list.querySelectorAll("li").length).toBe(2);
	expect(list.querySelectorAll("li")[0].textContent).toBe("x");
});

// ─── key-based reconciliation ─────────────────────────────────────────────────

it("bindEach reorders nodes without re-rendering them", async () => {
	const state = reactive({ items: [{ id: 1, text: "a" }, { id: 2, text: "b" }, { id: 3, text: "c" }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	const [nodeA, nodeB, nodeC] = Array.from(list.querySelectorAll("li"));

	state.items.reverse(); // [c, b, a]
	await nextTick();

	const nodes = list.querySelectorAll("li");
	expect(nodes[0].textContent).toBe("c");
	expect(nodes[1].textContent).toBe("b");
	expect(nodes[2].textContent).toBe("a");
	expect(nodes[0]).toBe(nodeC); // same DOM nodes, moved
	expect(nodes[1]).toBe(nodeB);
	expect(nodes[2]).toBe(nodeA);
});

it("bindEach unchanged key reuses the same DOM node", async () => {
	const state = reactive({ items: [{ id: 1, text: "a" }, { id: 2, text: "b" }] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text))
	);
	const nodeA = list.querySelectorAll("li")[0];
	state.items.push({ id: 3, text: "c" });
	await nextTick();
	expect(list.querySelectorAll("li")[0]).toBe(nodeA);
});

it("bindEach render is called only once per key across multiple reconciles", async () => {
	const state = reactive({ items: [{ id: 1 }, { id: 2 }] });
	const calls = new Map<number, number>();

	DOM.tag("ul", null,
		bindEach(() => state.items, item => item.id, item => {
			calls.set(item.id, (calls.get(item.id) ?? 0) + 1);
			return DOM.tag("li");
		})
	);
	expect(calls.get(1)).toBe(1);
	expect(calls.get(2)).toBe(1);

	state.items.push({ id: 3 });
	await nextTick();
	expect(calls.get(1)).toBe(1); // not re-rendered
	expect(calls.get(2)).toBe(1);
	expect(calls.get(3)).toBe(1);

	state.items.splice(0, 1); // remove id=1
	state.items.push({ id: 4 });
	await nextTick();
	expect(calls.get(2)).toBe(1);
	expect(calls.get(3)).toBe(1);
	expect(calls.get(4)).toBe(1);
});

// ─── untracked render ─────────────────────────────────────────────────────────

it("bindEach render is untracked: item property change does not trigger reconcile", async () => {
	const state = reactive({ items: [{ id: 1, name: "Alice" }] });
	let reconciles = 0;

	DOM.tag("ul", null,
		bindEach(
			() => { reconciles++; return state.items; },
			item => item.id,
			item => DOM.tag("li", null, item.name) // reads name without bind()
		)
	);
	expect(reconciles).toBe(1);

	state.items[0].name = "Bob"; // change tracked property
	await nextTick();
	expect(reconciles).toBe(1); // no reconcile — render was untracked
});

it("bind() inside render updates item in place without triggering reconcile", async () => {
	const state = reactive({ items: [{ id: 1, name: "Alice" }] });
	let reconciles = 0;

	const list = DOM.tag("ul", null,
		bindEach(
			() => { reconciles++; return state.items; },
			item => item.id,
			item => DOM.tag("li", null, bind(() => item.name))
		)
	);
	expect(list.textContent).toBe("Alice");
	expect(reconciles).toBe(1);

	state.items[0].name = "Bob"; // should update via bind(), not reconcile
	await nextTick();
	expect(list.textContent).toBe("Bob");
	expect(reconciles).toBe(1);
});

// ─── coexistence with other children ─────────────────────────────────────────

it("bindEach coexists with static siblings in the same container", async () => {
	const state = reactive({ items: [{ id: 1, text: "item" }] });
	const list = DOM.tag("ul", null,
		DOM.tag("li", null, "before"),
		bindEach(() => state.items, item => item.id, item => DOM.tag("li", null, item.text)),
		DOM.tag("li", null, "after")
	);
	const items = list.querySelectorAll("li");
	expect(items[0].textContent).toBe("before");
	expect(items[items.length - 1].textContent).toBe("after");

	state.items.push({ id: 2, text: "item2" });
	await nextTick();
	const updated = list.querySelectorAll("li");
	expect(updated[0].textContent).toBe("before");
	expect(updated[updated.length - 1].textContent).toBe("after");
});

it("two bindEach bindings in the same container work independently", async () => {
	const stateA = reactive({ items: [{ id: 1, text: "a" }] });
	const stateB = reactive({ items: [{ id: 10, text: "x" }] });

	const list = DOM.tag("ul", null,
		bindEach(() => stateA.items, i => i.id, i => DOM.tag("li", { class: "a" }, i.text)),
		bindEach(() => stateB.items, i => i.id, i => DOM.tag("li", { class: "b" }, i.text))
	);
	expect(list.querySelectorAll(".a").length).toBe(1);
	expect(list.querySelectorAll(".b").length).toBe(1);

	stateA.items.push({ id: 2, text: "a2" });
	await nextTick();
	expect(list.querySelectorAll(".a").length).toBe(2);
	expect(list.querySelectorAll(".b").length).toBe(1);
});

// ─── primitive items ──────────────────────────────────────────────────────────

it("bindEach works with primitive string items using value as key", async () => {
	const state = reactive({ tags: ["a", "b", "c"] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.tags, tag => tag, tag => DOM.tag("li", null, tag))
	);
	expect(Array.from(list.querySelectorAll("li")).map(n => n.textContent)).toEqual(["a", "b", "c"]);

	state.tags.push("d");
	await nextTick();
	expect(list.querySelectorAll("li").length).toBe(4);

	state.tags.splice(1, 1); // remove "b"
	await nextTick();
	expect(Array.from(list.querySelectorAll("li")).map(n => n.textContent)).toEqual(["a", "c", "d"]);
});

it("bindEach works with index as key for non-unique items", async () => {
	const state = reactive({ items: ["x", "x", "y"] });
	const list = DOM.tag("ul", null,
		bindEach(() => state.items, (_, i) => i, text => DOM.tag("li", null, text))
	);
	expect(list.querySelectorAll("li").length).toBe(3);

	state.items.pop();
	await nextTick();
	expect(list.querySelectorAll("li").length).toBe(2);
});

// ─── auto-dispose ─────────────────────────────────────────────────────────────

it("bindEach auto-disposes when its container is removed from the document", async () => {
	document.body.innerHTML = "";
	const state = reactive({ items: [{ id: 1 }] });
	let reconciles = 0;

	const container = DOM.tag("ul", null,
		bindEach(() => { reconciles++; return state.items; }, i => i.id, _ => DOM.tag("li"))
	);
	document.body.appendChild(container);
	await flush();
	expect(reconciles).toBe(1);

	container.remove();
	await flush(); // MutationObserver fires → effect stops

	state.items.push({ id: 2 });
	await nextTick();
	expect(reconciles).toBe(1); // effect was disposed
	document.body.innerHTML = "";
});

it("bindEach does not auto-dispose when container was never in the document", async () => {
	const state = reactive({ items: [{ id: 1 }] });
	let reconciles = 0;

	// create in detached state — never append to document
	DOM.tag("ul", null,
		bindEach(() => { reconciles++; return state.items; }, i => i.id, _ => DOM.tag("li"))
	);
	await flush();
	expect(reconciles).toBe(1);

	// effect must still respond because it was never mounted → never auto-disposed
	state.items.push({ id: 2 });
	await nextTick();
	expect(reconciles).toBe(2);
});

// ─── disposal when the container is cleared (regression: must not resurrect) ─────

it("bindEach is disposed when its container is cleared, so it never resurrects", async () => {
	const state = reactive({ items: [{ id: 1, text: "a" }, { id: 2, text: "b" }] });
	const ul = DOM.tag("ul", null, bindEach(() => state.items, i => i.id, i => DOM.tag("li", null, i.text)));
	document.body.appendChild(ul);
	await flush();
	expect(ul.querySelectorAll("li").length).toBe(2);

	ul.innerHTML = ""; // clear the rendered list and its anchor (container survives)
	await flush();      // the observer must dispose the now-detached effect

	state.items.push({ id: 3, text: "c" }); // mutate after clearing
	await nextTick();
	await flush();

	// the disposed effect must NOT re-render into the cleared container
	expect(ul.querySelectorAll("li").length).toBe(0);
	document.body.innerHTML = "";
});

it("bind() is disposed when its container is cleared, so it never resurrects", async () => {
	const state = reactive({ x: "a" });
	const div = DOM.tag("div", null, bind(() => state.x));
	document.body.appendChild(div);
	await flush();
	expect(div.textContent).toBe("a");

	div.innerHTML = ""; // clear the bound node (container survives)
	await flush();

	state.x = "b";
	await nextTick();
	await flush();

	expect(div.textContent).toBe(""); // disposed bind must not re-render
	document.body.innerHTML = "";
});
