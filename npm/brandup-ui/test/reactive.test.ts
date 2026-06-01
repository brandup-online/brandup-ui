import { reactive, effect, computed, effectScope, isReactive, toRaw, nextTick } from "../source/index";

it("effect re-runs when a tracked property changes (batched on microtask)", async () => {
	const state = reactive({ count: 0 });
	let observed = -1;

	effect(() => { observed = state.count; });
	expect(observed).toEqual(0); // initial run is synchronous

	state.count = 5;
	await nextTick();
	expect(observed).toEqual(5);
});

it("multiple synchronous changes are batched into a single effect run", async () => {
	const state = reactive({ a: 1, b: 1 });
	let runs = 0;
	let sum = 0;

	effect(() => { runs++; sum = state.a + state.b; });
	expect(runs).toEqual(1);

	state.a = 2;
	state.b = 3;
	state.a = 10;
	expect(runs).toEqual(1); // not yet — batched

	await nextTick();
	expect(runs).toEqual(2); // one re-run for all three changes
	expect(sum).toEqual(13);
});

it("effect only depends on the properties it actually reads (dynamic deps)", async () => {
	const state = reactive({ a: 1, b: 2, useA: true });
	let runs = 0;
	let value = 0;

	effect(() => { runs++; value = state.useA ? state.a : state.b; });
	expect(runs).toEqual(1);
	expect(value).toEqual(1);

	state.b = 20; // not a dependency while useA is true
	await nextTick();
	expect(runs).toEqual(1);

	state.useA = false; // switches the dependency to b
	await nextTick();
	expect(value).toEqual(20);
	expect(runs).toEqual(2);

	state.a = 100; // a is no longer a dependency
	await nextTick();
	expect(runs).toEqual(2);
});

it("deep reactivity: nested objects are reactive", async () => {
	const state = reactive({ user: { name: "Alice" } });
	let observed = "";
	effect(() => { observed = state.user.name; });
	expect(observed).toEqual("Alice");

	state.user.name = "Bob";
	await nextTick();
	expect(observed).toEqual("Bob");
});

it("arrays are reactive (push tracked via length)", async () => {
	const state = reactive({ items: [1, 2] });
	let len = -1;
	let sum = 0;
	effect(() => { len = state.items.length; sum = state.items.reduce((s, n) => s + n, 0); });
	expect(len).toEqual(2);
	expect(sum).toEqual(3);

	state.items.push(3);
	await nextTick();
	expect(len).toEqual(3);
	expect(sum).toEqual(6);
});

it("truncating an array via length notifies effects reading dropped indices", async () => {
	const state = reactive({ items: [1, 2, 3, 4] });
	let last = -1;
	effect(() => { last = state.items[3]; });
	expect(last).toEqual(4);

	state.items.length = 2;
	await nextTick();
	expect(last).toBeUndefined();
});

it("truncating an array via length notifies iteration-based effects", async () => {
	const state = reactive({ items: [1, 2, 3, 4] });
	let keys = 0;
	effect(() => { keys = Object.keys(state.items).length; });
	expect(keys).toEqual(4);

	state.items.length = 1;
	await nextTick();
	expect(keys).toEqual(1);
});

it("assigning an existing array index the same value does not re-run length effects", async () => {
	const state = reactive({ items: [1, 2, 3] });
	let runs = 0;
	effect(() => { void state.items.length; runs++; });
	expect(runs).toEqual(1);

	state.items[0] = 1; // unchanged value, length unaffected
	await nextTick();
	expect(runs).toEqual(1);
});

it("computed caches and recomputes only when dependencies change", () => {
	const state = reactive({ first: "Ada", last: "Lovelace" });
	let runs = 0;
	const full = computed(() => { runs++; return `${state.first} ${state.last}`; });

	expect(full.value).toEqual("Ada Lovelace");
	expect(full.value).toEqual("Ada Lovelace");
	expect(runs).toEqual(1); // cached

	state.first = "Augusta";
	expect(full.value).toEqual("Augusta Lovelace"); // pull-based: recomputes on read
	expect(runs).toEqual(2);
});

it("an effect reading a computed re-runs when the computed changes", async () => {
	const state = reactive({ n: 1 });
	const double = computed(() => state.n * 2);
	let observed = 0;

	effect(() => { observed = double.value; });
	expect(observed).toEqual(2);

	state.n = 5;
	await nextTick();
	expect(observed).toEqual(10);
});

it("effectScope stops all effects it collected", async () => {
	const state = reactive({ x: 0 });
	const scope = effectScope();
	let runs = 0;

	scope.run(() => effect(() => { runs++; void state.x; }));
	expect(runs).toEqual(1);

	state.x = 1;
	await nextTick();
	expect(runs).toEqual(2);

	scope.stop();
	state.x = 2;
	await nextTick();
	expect(runs).toEqual(2); // no longer reactive
});

it("isReactive / toRaw", () => {
	const raw = { a: 1 };
	const state = reactive(raw);
	expect(isReactive(state)).toBeTruthy();
	expect(isReactive(raw)).toBeFalsy();
	expect(toRaw(state)).toBe(raw);
	expect(reactive(state)).toBe(state); // idempotent
});
