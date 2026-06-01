import { ReactiveEffect } from "../reactive";

interface TrackedBinding {
	/** The binding's managed node (the bindEach anchor, or the bind() current node). */
	getNode: () => Node;
	/** Element the binding renders into — marked and indexed for subtree queries. */
	container: HTMLElement;
	effect: ReactiveEffect;
}

interface TrackedElement {
	node: HTMLElement;
	destroy: () => void;
}

// UIElements are located via the data attribute `UIElement.setElement` already sets
// (`elem.dataset.uiElement` → `data-ui-element`), so no extra marker is needed for them.
const UIELEM_SELECTOR = "[data-ui-element]";
// Marker placed on every element a reactive binding renders into, so a removed
// subtree (or a cleared container) can be queried for affected bindings.
const BINDING_ATTR = "data-bui-binding";
const BINDING_SELECTOR = "[data-bui-binding]";

// node → UIElement auto-destroy entry
const trackedElements = new Map<HTMLElement, TrackedElement>();
// container element → bindings rendered into it (one marker per container)
const bindingsByContainer = new Map<HTMLElement, Set<TrackedBinding>>();

let observer: MutationObserver | undefined;

/** @internal Test hook: counts how many tracked candidates the observer examines on removal. */
export const __bindingCleanupStats = { examined: 0 };

function ensureObserver(): void {
	if (typeof MutationObserver !== "undefined" && !observer) {
		observer = new MutationObserver(onMutations);
		observer.observe(document, { childList: true, subtree: true });
	}
}

function disconnectIfEmpty(): void {
	if (trackedElements.size === 0 && bindingsByContainer.size === 0 && observer) {
		observer.disconnect();
		observer = undefined;
	}
}

/**
 * React only to *removed* nodes (insertions never disconnect anything). Two cases:
 *  - a removed element subtree → dispose the tracked UIElements/bindings inside it;
 *  - children removed from a surviving container (e.g. `container.innerHTML = ""`) →
 *    re-check the bindings rendered directly into that container.
 * Work stays proportional to what changed, not to the total number tracked.
 */
function onMutations(mutations: MutationRecord[]): void {
	for (const mutation of mutations) {
		mutation.removedNodes.forEach(node => {
			if (node instanceof HTMLElement)
				disposeDisconnectedWithin(node);
		});

		// A binding's managed node (a text/comment) can be removed while its container
		// stays connected (a cleared/replaced container). The container itself is then
		// the mutation target, not a removed node, so check its bindings here.
		const target = mutation.target;
		if (mutation.removedNodes.length && target instanceof HTMLElement && target.hasAttribute(BINDING_ATTR))
			disposeDisconnectedBindings(target);
	}

	disconnectIfEmpty();
}

/** Apply `fn` to `root` itself (when it matches) and every descendant matching `selector`. */
function forEachSelfAndMatches(root: HTMLElement, selector: string, fn: (el: HTMLElement) => void): void {
	if (root.matches(selector))
		fn(root);
	root.querySelectorAll(selector).forEach(el => fn(el as HTMLElement));
}

/** Destroy/stop tracked entries inside a removed subtree that are no longer in the document. */
function disposeDisconnectedWithin(removed: HTMLElement): void {
	// UIElements first: destroying one cascades to its nested UIElements and bindings.
	forEachSelfAndMatches(removed, UIELEM_SELECTOR, el => {
		__bindingCleanupStats.examined++;
		// `isConnected` guards against moves (removed from one place, re-inserted in another).
		if (!el.isConnected) {
			const entry = trackedElements.get(el);
			if (entry)
				entry.destroy(); // destroy() untracks itself, cascades, and disposes its bindings
		}
	});

	forEachSelfAndMatches(removed, BINDING_SELECTOR, disposeDisconnectedBindings);
}

/** Stop the bindings of `container` whose managed node has left the document. */
function disposeDisconnectedBindings(container: HTMLElement): void {
	const set = bindingsByContainer.get(container);
	if (!set)
		return;

	for (const binding of [...set]) {
		__bindingCleanupStats.examined++;
		if (!binding.getNode().isConnected) {
			set.delete(binding);
			binding.effect.stop();
		}
	}

	if (!set.size) {
		bindingsByContainer.delete(container);
		container.removeAttribute(BINDING_ATTR);
	}
}

/** Stop and forget every binding of `container`, unconditionally (owner is being destroyed). */
function stopAllBindings(container: HTMLElement): void {
	const set = bindingsByContainer.get(container);
	if (!set)
		return;

	bindingsByContainer.delete(container);
	container.removeAttribute(BINDING_ATTR);
	set.forEach(binding => binding.effect.stop());
}

/**
 * Track a binding so its reactive effect is stopped automatically once its managed node has
 * been mounted and then removed from the document (via a shared `MutationObserver`), and so
 * {@link disposeBindingsWithin} can stop it when its owning UIElement is destroyed.
 *
 * @param container Element the binding renders into (indexed/marked for subtree queries).
 * @param getNode Returns the binding's current managed node — its connectivity drives disposal.
 * @param effect The reactive effect to stop on disposal.
 */
export function autoDisposeBinding(container: HTMLElement, getNode: () => Node, effect: ReactiveEffect): void {
	let set = bindingsByContainer.get(container);
	if (!set) {
		bindingsByContainer.set(container, set = new Set());
		container.setAttribute(BINDING_ATTR, "");
	}
	set.add({ getNode, container, effect });

	ensureObserver();
}

/**
 * Register a `UIElement`'s DOM node for auto-destroy: once the node has been mounted
 * into the document and then removed, `destroy` is called automatically.
 * @internal — called by `UIElement.setElement`.
 */
export function trackAutoDestroy(node: HTMLElement, destroy: () => void): void {
	trackedElements.set(node, { node, destroy });
	ensureObserver();
}

/**
 * Remove a node from auto-destroy tracking (called when `UIElement.destroy` is
 * invoked explicitly so the entry does not linger).
 * @internal — called by `UIElement.destroy`.
 */
export function untrackAutoDestroy(node: HTMLElement): void {
	trackedElements.delete(node);
	disconnectIfEmpty();
}

/**
 * Destroy every tracked `UIElement` nested within `root` (excluding `root` itself),
 * deepest first. Located via the `data-ui-element` marker, so the cost is proportional
 * to the subtree rather than to the total number of tracked elements.
 * @internal — called by `UIElement.destroy`.
 */
export function destroyUIElementsWithin(root: HTMLElement): void {
	const victims: HTMLElement[] = [];
	root.querySelectorAll(UIELEM_SELECTOR).forEach(el => {
		if (trackedElements.has(el as HTMLElement))
			victims.push(el as HTMLElement);
	});

	// querySelectorAll yields document order (ancestors before descendants);
	// iterate in reverse so deeper / nested elements are destroyed first.
	for (let i = victims.length - 1; i >= 0; i--)
		trackedElements.get(victims[i])?.destroy();
}

/**
 * Stop and forget every tracked binding rendered within `root` (used when a UIElement is
 * destroyed). Unlike the observer path this is unconditional — it does not check connectivity,
 * because the owner is being torn down.
 */
export function disposeBindingsWithin(root: Node): void {
	if (root instanceof HTMLElement)
		forEachSelfAndMatches(root, BINDING_SELECTOR, stopAllBindings);

	disconnectIfEmpty();
}
