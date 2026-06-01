import { effect, untrack } from "../reactive";
import { autoDisposeBinding } from "./binding-cleanup";

/** A keyed-list binding produced by {@link bindEach}; handled by `appendChild` in `tag.ts`. */
export class BindingEach<T = any> {
	constructor(
		readonly getItems: () => T[],
		readonly getKey: (item: T, index: number) => string | number,
		readonly render: (item: T) => Element
	) { }
}

/**
 * Create a reactive keyed-list binding for use as a {@link tag} child.
 *
 * The `getItems` function is tracked; the list is reconciled whenever the array
 * changes (push, splice, reassignment, etc.). Items are matched by `getKey` so
 * unchanged nodes stay in place — only new, removed, or reordered nodes are touched.
 *
 * `render` is called **once per key** and runs **untracked**. Use `bind()` inside
 * the render function for item properties that should update independently:
 *
 * ⚠️ The item object passed to `render` is captured at first render for that key.
 * Mutate items in place (`item.name = "..."`) so `bind()` reactions fire. Replacing
 * the array with **new objects that reuse the same keys** keeps the cached node bound
 * to the *old* object, so per-item `bind()`s won't update — change the key, or mutate
 * the existing item, when its identity should change.
 *
 * @example
 * DOM.tag("ul", null,
 *     bindEach(() => state.users, u => u.id, u =>
 *         DOM.tag("li", null, bind(() => u.name))
 *     )
 * );
 */
export function bindEach<T>(
	getItems: () => T[],
	getKey: (item: T, index: number) => string | number,
	render: (item: T) => Element
): BindingEach<T> {
	return new BindingEach(getItems, getKey, render);
}

/**
 * Mount a {@link BindingEach} into `container` and start tracking.
 * Called by `appendChild` in `tag.ts`; not intended for direct use.
 * @internal
 */
export function appendBindingEach<T>(container: HTMLElement, binding: BindingEach<T>): void {
	const nodes = new Map<string | number, Element>();

	// Anchor comment marks the start of the managed region inside the container.
	// Using an anchor (rather than container.firstChild) lets other children coexist.
	const anchor = document.createComment("");
	container.append(anchor);

	const eff = effect(() => {
		const items = binding.getItems();

		const nextKeys = new Set<string | number>();
		for (let i = 0; i < items.length; i++)
			nextKeys.add(binding.getKey(items[i], i));

		// Remove nodes whose keys are no longer present
		for (const [key, node] of nodes) {
			if (!nextKeys.has(key)) {
				node.remove();
				nodes.delete(key);
			}
		}

		// Insert new nodes and restore order in a single pass starting after the anchor.
		// If the node is already at the expected position we advance; otherwise insertBefore moves it.
		let cursor: ChildNode | null = anchor.nextSibling;
		for (let i = 0; i < items.length; i++) {
			const key = binding.getKey(items[i], i);
			let node = nodes.get(key);

			if (!node) {
				// Render untracked so item-property reads don't create dependencies on
				// this list effect — use bind() inside render for fine-grained updates.
				node = untrack(() => binding.render(items[i]));
				nodes.set(key, node);
			}

			if (cursor !== node)
				container.insertBefore(node, cursor);
			else
				cursor = cursor.nextSibling;
		}
	});

	autoDisposeBinding(container, eff);
}
