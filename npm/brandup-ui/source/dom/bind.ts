import { UIElement } from "../element";

/** Value a reactive binding can render: text (`string`/`number`), an `Element` or {@link UIElement}, or `null`/`undefined`/`false` (rendered as nothing). */
export type BindingValue = string | number | boolean | Element | UIElement<any> | null | undefined;

/**
 * A reactive binding for use as a {@link tag} child. Its `compute` function is
 * re-evaluated and re-rendered whenever the reactive state it reads changes.
 */
export class Binding {
	constructor(readonly compute: () => BindingValue) { }
}

/**
 * Create a reactive {@link Binding} that can be passed as a `tag` child. The
 * compute function is tracked: it re-runs (updating the DOM in place) whenever
 * any reactive value it reads changes.
 *
 * @example
 * const state = reactive({ name: "Alice" });
 * DOM.tag("div", null, "Hi, ", bind(() => state.name));
 * state.name = "Bob"; // the text updates in place
 */
export function bind(compute: () => BindingValue): Binding {
	return new Binding(compute);
}
