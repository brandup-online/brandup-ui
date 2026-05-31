import { ReactiveEffect } from "../reactive";

interface TrackedBinding {
	getNode: () => Node;
	effect: ReactiveEffect;
	mounted: boolean;
}

interface TrackedElement {
	node: HTMLElement;
	destroy: () => void;
	mounted: boolean;
}

const tracked = new Set<TrackedBinding>();
const trackedElements = new Set<TrackedElement>();
let observer: MutationObserver | undefined;

function disconnectIfEmpty(): void {
	if (tracked.size === 0 && trackedElements.size === 0 && observer) {
		observer.disconnect();
		observer = undefined;
	}
}

function ensureObserver(): void {
	if (typeof MutationObserver !== "undefined" && !observer) {
		observer = new MutationObserver(checkBindings);
		observer.observe(document, { childList: true, subtree: true });
	}
}

function checkBindings(): void {
	tracked.forEach(binding => {
		if (binding.getNode().isConnected)
			binding.mounted = true;
		else if (binding.mounted) {
			binding.effect.stop();
			tracked.delete(binding);
		}
	});

	trackedElements.forEach(entry => {
		if (entry.node.isConnected)
			entry.mounted = true;
		else if (entry.mounted) {
			// was in the document and is now removed → destroy the UIElement
			entry.destroy();
			trackedElements.delete(entry);
		}
	});

	disconnectIfEmpty();
}

/**
 * Track a binding so its reactive effect is stopped automatically once its node has
 * been mounted into the document and then removed from it (via a shared `MutationObserver`),
 * and so {@link disposeBindingsWithin} can stop it on owner destroy.
 *
 * Nodes that are never mounted are not auto-removed; the `MutationObserver` part is a
 * no-op in environments without it, but tracking for `disposeBindingsWithin` still works.
 */
export function autoDisposeBinding(getNode: () => Node, effect: ReactiveEffect): void {
	tracked.add({ getNode, effect, mounted: getNode().isConnected });
	ensureObserver();
}

/**
 * Register a `UIElement`'s DOM node for auto-destroy: once the node has been mounted
 * into the document and then removed, `destroy` is called automatically.
 * @internal — called by `UIElement.setElement`.
 */
export function trackAutoDestroy(node: HTMLElement, destroy: () => void): void {
	trackedElements.add({ node, destroy, mounted: node.isConnected });
	ensureObserver();
}

/**
 * Remove a node from auto-destroy tracking (called when `UIElement.destroy` is
 * invoked explicitly so the entry does not linger in the set).
 * @internal — called by `UIElement.destroy`.
 */
export function untrackAutoDestroy(node: HTMLElement): void {
	for (const entry of trackedElements) {
		if (entry.node === node) {
			trackedElements.delete(entry);
			break;
		}
	}
	disconnectIfEmpty();
}

/** Stop and forget every tracked binding whose node lies within `root` (used when a UIElement is destroyed). */
export function disposeBindingsWithin(root: Node): void {
	tracked.forEach(binding => {
		const node = binding.getNode();
		if (node === root || root.contains(node)) {
			binding.effect.stop();
			tracked.delete(binding);
		}
	});

	disconnectIfEmpty();
}
