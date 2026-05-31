import { ReactiveEffect, track, trigger } from "./effect";

/** A lazily-evaluated, cached reactive value derived from other reactive state. */
export class ComputedRef<T = any> {
	private __value!: T;
	private __dirty = true;
	private readonly __effect: ReactiveEffect<T>;

	constructor(getter: () => T) {
		this.__effect = new ReactiveEffect(getter, () => {
			// a dependency changed: mark dirty and notify effects that read this computed
			if (!this.__dirty) {
				this.__dirty = true;
				trigger(this, "value");
			}
		});
	}

	/** The current value; recomputed on read only when its dependencies have changed. */
	get value(): T {
		if (this.__dirty) {
			this.__value = this.__effect.run();
			this.__dirty = false;
		}
		track(this, "value");
		return this.__value;
	}
}

/** Create a {@link ComputedRef} from a getter. */
export function computed<T>(getter: () => T): ComputedRef<T> {
	return new ComputedRef(getter);
}
