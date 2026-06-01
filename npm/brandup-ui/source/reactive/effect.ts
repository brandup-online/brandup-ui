/** Key used to track iteration/length dependencies (object key enumeration, array growth). */
export const ITERATE_KEY = Symbol("iterate");

/**
 * A reactive effect: a function whose reactive reads are tracked, so it re-runs
 * whenever any of those reactive dependencies change.
 */
export class ReactiveEffect<T = any> {
	/** Dependency sets this effect is currently subscribed to. @internal */
	readonly deps: Set<ReactiveEffect>[] = [];
	private __active = true;

	/** Called instead of `run` when a dependency changes (used by `computed`). */
	scheduler?: () => void;
	/** Invoked once when the effect is stopped. */
	onStop?: () => void;

	constructor(private readonly __fn: () => T, scheduler?: () => void) {
		this.scheduler = scheduler;
		activeScope?.add(this);
	}

	/** Whether the effect is still active (not stopped). */
	get active(): boolean { return this.__active; }

	/** Run the effect, (re)collecting its dependencies. */
	run(): T {
		if (!this.__active)
			return this.__fn();

		cleanupEffect(this);

		const prevEffect = activeEffect;
		activeEffect = this;
		try {
			return this.__fn();
		}
		finally {
			activeEffect = prevEffect;
		}
	}

	/** Stop the effect: remove its subscriptions and run `onStop`. */
	stop(): void {
		if (!this.__active)
			return;
		cleanupEffect(this);
		this.__active = false;
		this.onStop?.();
	}
}

let activeEffect: ReactiveEffect | undefined;
let activeScope: EffectScope | undefined;

const targetMap = new WeakMap<object, Map<PropertyKey, Set<ReactiveEffect>>>();

/** Record the active effect (if any) as depending on `target[key]`. @internal */
export function track(target: object, key: PropertyKey): void {
	if (!activeEffect)
		return;

	let depsMap = targetMap.get(target);
	if (!depsMap)
		targetMap.set(target, depsMap = new Map());

	let dep = depsMap.get(key);
	if (!dep)
		depsMap.set(key, dep = new Set());

	if (!dep.has(activeEffect)) {
		dep.add(activeEffect);
		activeEffect.deps.push(dep);
	}
}

/** Re-run (or schedule) every effect that depends on `target[key]`. @internal */
export function trigger(target: object, key: PropertyKey): void {
	const depsMap = targetMap.get(target);
	if (!depsMap)
		return;

	const dep = depsMap.get(key);
	if (!dep)
		return;

	// copy first: running an effect re-collects deps and would mutate the live set
	const effects = new Set<ReactiveEffect>();
	dep.forEach(e => { if (e !== activeEffect) effects.add(e); });

	effects.forEach(e => {
		if (e.scheduler)
			e.scheduler();
		else
			queueEffect(e);
	});
}

const jobQueue = new Set<ReactiveEffect>();
const resolvedPromise = Promise.resolve();
let isFlushPending = false;
let currentFlush: Promise<void> | null = null;

/** Queue an effect to run on the next microtask, deduplicated so multiple sync changes batch into one run. */
function queueEffect(effect: ReactiveEffect): void {
	jobQueue.add(effect);
	if (!isFlushPending) {
		isFlushPending = true;
		currentFlush = resolvedPromise.then(flushJobs);
	}
}

function flushJobs(): void {
	isFlushPending = false;

	let guard = 0;
	while (jobQueue.size) {
		if (++guard > 10000) {
			jobQueue.clear();
			throw new Error("Reactive effect flush exceeded the iteration limit (cyclic update?).");
		}

		const jobs = Array.from(jobQueue);
		jobQueue.clear();
		for (const effect of jobs) {
			if (effect.active)
				effect.run();
		}
	}

	currentFlush = null;
}

/**
 * Resolves after the currently pending batch of reactive effects has flushed.
 * Effect re-runs (and the DOM updates they drive) are batched on the microtask queue,
 * so await `nextTick()` to observe their results.
 */
export function nextTick(fn?: () => void): Promise<void> {
	const p = currentFlush || resolvedPromise;
	return fn ? p.then(fn).then(() => { }) : p.then(() => { });
}

/**
 * Execute `fn` without tracking any reactive reads.
 * Use inside a reactive context when you want to read state without creating a dependency.
 */
export function untrack<T>(fn: () => T): T {
	const prev = activeEffect;
	activeEffect = undefined;
	try {
		return fn();
	}
	finally {
		activeEffect = prev;
	}
}

function cleanupEffect(effect: ReactiveEffect): void {
	const { deps } = effect;
	deps.forEach(dep => dep.delete(effect));
	deps.length = 0;
}

/** Create and immediately run a reactive effect. Returns the {@link ReactiveEffect}. */
export function effect<T>(fn: () => T, scheduler?: () => void): ReactiveEffect<T> {
	const e = new ReactiveEffect(fn, scheduler);
	e.run();
	return e;
}

/** A disposable container that collects effects (and nested scopes) so they can be stopped together. */
export class EffectScope {
	private readonly __effects: ReactiveEffect[] = [];
	private readonly __scopes: EffectScope[] = [];
	private __active = true;

	/** Whether the scope is still active (not stopped). */
	get active(): boolean { return this.__active; }

	/** @internal */
	add(effect: ReactiveEffect): void { this.__effects.push(effect); }
	/** @internal */
	addScope(scope: EffectScope): void { this.__scopes.push(scope); }

	/** Run `fn` with this scope active; effects created during the call register to it. */
	run<T>(fn: () => T): T {
		const prev = activeScope;
		activeScope = this;
		try {
			return fn();
		}
		finally {
			activeScope = prev;
		}
	}

	/** Stop all effects and nested scopes collected by this scope. */
	stop(): void {
		if (!this.__active)
			return;
		this.__active = false;
		this.__effects.forEach(e => e.stop());
		this.__effects.length = 0;
		this.__scopes.forEach(s => s.stop());
		this.__scopes.length = 0;
	}
}

/** Create a new {@link EffectScope}, nested in the current scope if one is active. */
export function effectScope(): EffectScope {
	const scope = new EffectScope();
	activeScope?.addScope(scope);
	return scope;
}
