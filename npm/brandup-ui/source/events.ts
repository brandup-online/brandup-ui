let ListenCounter = 1;

/**
 * Minimal event emitter with support for one-off listeners and cross-emitter listening.
 *
 * The optional `TEvents` type parameter is an event map (`{ eventName: (args) => void }`)
 * that gives subclasses strongly-typed event names, callback signatures and `trigger` arguments.
 * When omitted it defaults to a loose map, so untyped usage keeps working.
 */
export class EventEmitter<TEvents = EventMap> {
	private _events?: { [key: EventName]: EventCallback[] };
	private _listenId?: string;
	private _listeningTo?: { [id: string]: EventListening };

	/**
	 * Subscribe to an event.
	 * @param eventName Event name, or `"all"` to receive every event.
	 * @param callback Handler invoked when the event is triggered.
	 * @param context Optional `this`/context bound to the handler and used for removal matching.
	 */
	on<K extends keyof TEvents & string>(eventName: K, callback: TEvents[K], context?: EventContextInit): this;
	on(eventName: "all", callback: EventCallbackFunc, context?: EventContextInit): this;
	on(eventName: string, callback: any, context?: EventContextInit): this {
		const events = this._getOrCreateEvents(eventName);
		events.push({ callback, context: context || undefined, ctx: context || this });
		return this;
	}

	/**
	 * Subscribe to an event for a single invocation; the handler is removed after it fires once.
	 * @param eventName Event name, or `"all"` to receive every event.
	 * @param callback Handler invoked once when the event is triggered.
	 * @param context Optional `this`/context bound to the handler and used for removal matching.
	 */
	once<K extends keyof TEvents & string>(eventName: K, callback: TEvents[K], context?: EventContextInit): this;
	once(eventName: "all", callback: EventCallbackFunc, context?: EventContextInit): this;
	once(eventName: string, callback: any, context?: EventContextInit): this {
		const wrapper = (...args: any[]) => {
			this.off(<any>eventName, wrapper, context);
			callback.apply(context || this, args);
		};
		return this.on(<any>eventName, wrapper, context);
	}

	/**
	 * Remove event subscriptions. At least one argument is required.
	 * Listeners matching all provided filters are removed; omitted filters match anything.
	 * @param eventName Event name to remove, or omit to match all events.
	 * @param callback Handler to remove, or omit to match all handlers.
	 * @param context Context to remove, or omit to match all contexts.
	 */
	off<K extends keyof TEvents & string>(eventName?: K | "all" | null, callback?: TEvents[K] | EventCallbackFunc | null, context?: EventContextInit | null): this;
	off(eventName?: string | null, callback?: any, context?: EventContextInit | null): this {
		if (!eventName && !callback && !context)
			throw new Error("Require off arguments.");

		const events = this._events;
		if (!events)
			return this;

		callback = callback || undefined;
		context = context || undefined;

		const eventNames = eventName ? [eventName.toLowerCase()] : Object.keys(events);
		for (let i = 0; i < eventNames.length; i++) {
			const name = eventNames[i];
			const currentCallbacks = events[name];
			if (!currentCallbacks)
				continue;

			// reset callback list
			const newCallbacks: EventCallback[] = events[name] = [];

			if (callback || context) {
				currentCallbacks.forEach(c => {
					const callbackMatch = !callback || c.callback === callback;
					const contextMatch = !context || c.context === context;
					if (callbackMatch && contextMatch)
						return;

					newCallbacks.push(c);
				});
			}

			if (!newCallbacks.length)
				delete events[name];
		}

		return this;
	}

	/**
	 * Listen to an event on another emitter, tracking the subscription so it can be released via `stopListening`.
	 * @param source Emitter to subscribe to.
	 * @param eventName Event name to listen for.
	 * @param callback Handler invoked when the event is triggered.
	 */
	protected listenTo(source: EventEmitter<any>, eventName: string, callback: EventCallbackFunc): this {
		this._addListeningTo(source, eventName);
		source.on(eventName, callback, this);
		return this;
	}

	/**
	 * Listen once to an event on another emitter; the subscription is tracked and auto-removed after it fires.
	 * @param source Emitter to subscribe to.
	 * @param eventName Event name to listen for.
	 * @param callback Handler invoked once when the event is triggered.
	 */
	protected listenToOnce(source: EventEmitter<any>, eventName: string, callback: EventCallbackFunc): this {
		this._addListeningTo(source, eventName);
		source.once(eventName, callback, this);
		return this;
	}

	/**
	 * Release subscriptions previously established with `listenTo`/`listenToOnce`.
	 * Omitted arguments broaden the match (e.g. no `source` releases all tracked emitters).
	 * @param source Limit to a specific emitter, or omit for all.
	 * @param eventName Limit to a specific event, or omit for all.
	 * @param callback Limit to a specific handler, or omit for all.
	 */
	protected stopListening(source?: EventEmitter<any>, eventName?: string, callback?: EventCallbackFunc): this {
		if (!this._listeningTo)
			return this;

		let sourceListening: EventListening | undefined;
		if (source) {
			if (!source._listenId)
				throw new Error("Emmiter is not set id.");
			sourceListening = this._listeningTo[source._listenId];
		}

		const sources = sourceListening ? [sourceListening] : Object.values(this._listeningTo);
		sources.forEach(source => {
			const removeEventNames = eventName ? [eventName] : source.events;
			removeEventNames.forEach(eventName => {
				source.emitter.off(eventName, callback, this);

				const index = source.events.indexOf(eventName);
				if (index >= 0)
					source.events.splice(index, 1);
			});

			if (!source.events.length && source.emitter._listenId && this._listeningTo)
				delete this._listeningTo[source.emitter._listenId];
		});

		if (!this._listeningTo || Object.keys(this._listeningTo).length === 0)
			delete this._listeningTo;

		return this;
	}

	private _addListeningTo(source: EventEmitter<any>, eventName: EventName) {
		const listeningTo = this._listeningTo || (this._listeningTo = {});
		const listenId = source._listenId || (source._listenId = `l${ListenCounter++}`);

		const listenTo = listeningTo[listenId] || (listeningTo[listenId] = { emitter: source, events: [] });

		eventName = eventName.toLowerCase();
		// allow multiple callbacks for the same source+event; keep the
		// event-name list unique so stopListening still cleans them up.
		if (listenTo.events.indexOf(eventName) === -1)
			listenTo.events.push(eventName);
	}

	private stopAllListeners() {
		if (!this._events)
			return;

		Object.values(this._events).forEach(callbacks => {
			callbacks.forEach(callback => {
				if (callback.context instanceof EventEmitter)
					callback.context.stopListening(this);
			});
		});

		delete this._events;
	}

	/**
	 * Trigger an event, invoking all matching handlers plus any `"all"` listeners.
	 * @param eventName Event name to trigger (`"all"` is reserved and not allowed).
	 * @param args Arguments forwarded to each handler.
	 */
	protected trigger<K extends keyof TEvents & string>(eventName: K, ...args: TEvents[K] extends (...a: infer A) => any ? A : never): this;
	protected trigger(eventName: string, ...args: any[]): this {
		eventName = eventName.toLowerCase();

		if (eventName === "all")
			throw new Error('Not allow trigger all event.');
		if (!this._events)
			return this;

		const events = this._getEvents(eventName);
		const allEvents = this._getEvents("all");
		this._triggerEvent(events, ...args);
		this._triggerEvent(allEvents, ...args);

		return this;
	}

	private _triggerEvent(events: EventCallback[] | undefined, ...args: any[]) {
		if (!events || !events.length)
			return;

		// snapshot so callbacks added/removed during dispatch don't affect this trigger
		const snapshot = events.slice();
		for (let i = 0; i < snapshot.length; i++) {
			const event = snapshot[i];
			event.callback.apply(event.ctx, args);
		}
	}

	private _getOrCreateEvents(eventName: string) {
		eventName = eventName.toLowerCase();
		const events = this._events || (this._events = {});
		return events[eventName] || (events[eventName] = []);
	}

	private _getEvents(eventName: EventName) {
		if (!eventName)
			return;
		const events = this._events;
		if (!events)
			return;

		return events[eventName];
	}

	/** Release every subscription: both events this emitter listens to and listeners registered on it. */
	protected stopEvents() {
		this.stopListening();
		this.stopAllListeners();
	}
}

/** Map of event name to its handler signature; used as the `TEvents` parameter of {@link EventEmitter}. */
export type EventMap = Record<string, (...args: any[]) => void>;
/** Event name; the special value `"all"` matches every triggered event. */
export type EventName = "all" | string;
/** Event handler signature; receives the arguments passed to `trigger`. */
export type EventCallbackFunc = (...args: any[]) => void;
/** Arbitrary context bound as `this` to a handler and used to match it on removal. */
export type EventContextInit = any;

interface EventCallback {
	callback: EventCallbackFunc;
	context?: EventContextInit;
	ctx: EventContextInit;
}

interface EventListening {
	emitter: EventEmitter<any>;
	events: EventName[];
}
