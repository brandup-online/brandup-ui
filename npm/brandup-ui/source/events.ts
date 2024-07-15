export class EventEmitter {
	private readonly _events: { [key: string]: Event[] } = {};

	on(eventName: string, callback: () => void, context?: any) {
		const event = this._getOrCreateEvents(eventName);
		event.push({
			callback: callback,
			context: context,
			ctx: context ? context : this
		});
	}

	off() {

	}

	once() {

	}

	stopListening() {

	}

	listenTo() {

	}

	listenToOnce() {

	}

	listenToAndRun() {

	}

	isListening() {

	}

	private _getOrCreateEvents(eventName: string) {
		return this._events[eventName] || (this._events[eventName] = []);
	}
}

interface Event {
	callback: () => void;
	context: any;
	ctx: any;
}