import { track, trigger, ITERATE_KEY } from "./effect";

const RAW = Symbol("raw");
const reactiveMap = new WeakMap<object, any>();

function isObject(value: unknown): value is object {
	return value !== null && typeof value === "object";
}

function isIntegerKey(key: PropertyKey): boolean {
	return typeof key === "string" && /^\d+$/.test(key);
}

/** Whether a value is a reactive proxy created by {@link reactive}. */
export function isReactive(value: unknown): boolean {
	return isObject(value) && !!(value as any)[RAW];
}

/** Return the underlying raw (non-reactive) object behind a reactive proxy, or the value itself. */
export function toRaw<T>(value: T): T {
	const raw = isObject(value) && (value as any)[RAW];
	return raw ? raw as T : value;
}

const handlers: ProxyHandler<object> = {
	get(target, key, receiver) {
		if (key === RAW)
			return target;

		const result = Reflect.get(target, key, receiver);

		// don't track symbol keys (well-known symbols, internal lookups)
		if (typeof key === "symbol")
			return result;

		track(target, key);

		// deep: wrap nested objects/arrays lazily on read
		return isObject(result) ? reactive(result) : result;
	},
	set(target, key, value, receiver) {
		const hadKey = Array.isArray(target) && isIntegerKey(key)
			? Number(key) < target.length
			: Object.prototype.hasOwnProperty.call(target, key);
		const oldValue = (target as any)[key];

		const result = Reflect.set(target, key, toRaw(value), receiver);
		if (!result)
			return result;

		if (!hadKey) {
			trigger(target, key);
			trigger(target, ITERATE_KEY);
		}
		else if (!Object.is(oldValue, toRaw(value))) {
			trigger(target, key);
		}

		// array mutation changes its length (push/splice/index assignment)
		if (Array.isArray(target) && key !== "length")
			trigger(target, "length");

		return result;
	},
	deleteProperty(target, key) {
		const hadKey = Object.prototype.hasOwnProperty.call(target, key);
		const result = Reflect.deleteProperty(target, key);
		if (hadKey && result) {
			trigger(target, key);
			trigger(target, ITERATE_KEY);
		}
		return result;
	},
	has(target, key) {
		if (typeof key !== "symbol")
			track(target, key);
		return Reflect.has(target, key);
	},
	ownKeys(target) {
		track(target, ITERATE_KEY);
		return Reflect.ownKeys(target);
	}
};

/**
 * Wrap an object or array in a deep reactive proxy. Reads are tracked and writes
 * notify effects. Returns the same proxy for the same target, and non-objects unchanged.
 */
export function reactive<T extends object>(target: T): T {
	if (!isObject(target))
		return target;
	if ((target as any)[RAW])
		return target; // already reactive

	const existing = reactiveMap.get(target);
	if (existing)
		return existing;

	const proxy = new Proxy(target, handlers);
	reactiveMap.set(target, proxy);
	return proxy as T;
}
