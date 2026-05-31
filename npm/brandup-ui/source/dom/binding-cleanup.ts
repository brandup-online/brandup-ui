import { ReactiveEffect } from "../reactive";

interface TrackedBinding {
	getNode: () => Node;
	effect: ReactiveEffect;
	mounted: boolean;
}

const tracked = new Set<TrackedBinding>();
let observer: MutationObserver | undefined;

function disconnectIfEmpty(): void {
	if (tracked.size === 0 && observer) {
		observer.disconnect();
		observer = undefined;
	}
}

function checkBindings(): void {
	tracked.forEach(binding => {
		if (binding.getNode().isConnected)
			binding.mounted = true;
		else if (binding.mounted) {
			// was in the document and is now removed → stop the effect
			binding.effect.stop();
			tracked.delete(binding);
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

	if (typeof MutationObserver !== "undefined" && !observer) {
		observer = new MutationObserver(checkBindings);
		observer.observe(document, { childList: true, subtree: true });
	}
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
