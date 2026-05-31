let ListenCounter = 1;

export class EventEmitter {
	private _events?: { [key: EventName]: EventCallback[] };
	private _listenId?: string;
	private _listeningTo?: { [id: string]: EventListening };

	on(eventName: EventName, callback: EventCallbackFunc, context?: EventContextInit) {
		const events = this._getOrCreateEvents(eventName);
		events.push({ callback, context: context || undefined, ctx: context || this });
		return this;
	}

	once(eventName: EventName, callback: EventCallbackFunc, context?: EventContextInit) {
		const wrapper = (...args: any[]) => {
			this.off(eventName, wrapper, context);
			callback.apply(context || this, args);
		};
		return this.on(eventName, wrapper, context);
	}

	off(eventName?: EventName | null, callback?: EventCallbackFunc | null, context?: EventContextInit | null) {
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

	protected listenTo(source: EventEmitter, eventName: EventName, callback: EventCallbackFunc) {
		this._addListeningTo(source, eventName);
		source.on(eventName, callback, this);
		return this;
	}

	protected listenToOnce(source: EventEmitter, eventName: EventName, callback: EventCallbackFunc) {
		this._addListeningTo(source, eventName);
		source.once(eventName, callback, this);
		return this;
	}

	protected stopListening(source?: EventEmitter, eventName?: EventName, callback?: EventCallbackFunc) {
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

	private _addListeningTo(source: EventEmitter, eventName: EventName) {
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

	protected trigger(eventName: string, ...args: any[]) {
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

	protected stopEvents() {
		this.stopListening();
		this.stopAllListeners();
	}
}

export type EventName = "all" | string;
export type EventCallbackFunc = (...args: any[]) => void;
export type EventContextInit = any;

interface EventCallback {
	callback: EventCallbackFunc;
	context?: EventContextInit;
	ctx: EventContextInit;
}

interface EventListening {
	emitter: EventEmitter;
	events: EventName[];
}