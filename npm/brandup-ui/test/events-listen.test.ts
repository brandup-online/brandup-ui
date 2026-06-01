import { EventEmitter, EventCallbackFunc, EventContextInit } from "../source/events";

it('EventEmitter.listenTo success', () => {
	const component1 = new Component();

	let externalValue: string | undefined;
	const onChange = (value: string) => {
		externalValue = value;
	};
	component1.textbox.on("change", onChange);

	component1.test_listenTo();
	expect(component1.listeningTo).not.toBeUndefined();
	expect(component1.listeningTo[component1.textbox.listenId]).not.toBeUndefined();
	expect(component1.listeningTo[component1.textbox.listenId].emitter).toEqual(component1.textbox);
	expect(component1.listeningTo[component1.textbox.listenId].subscriptions.map(s => s.eventName)).toContain("change");

	component1.textbox.change("value");
	expect(component1.text).toEqual("value");
	expect(component1.counter).toEqual(1);
	expect(externalValue).toEqual("value");

	component1.textbox.change("value2");
	expect(component1.text).toEqual("value2");
	expect(component1.counter).toEqual(2);
	expect(externalValue).toEqual("value2");

	component1.stopListenChange();
	expect(component1.listeningTo).toBeUndefined();
	expect(component1.textbox.events["change"].length).toEqual(1);
	expect(component1.textbox.events["change"][0].callback).toEqual(onChange);

	component1.textbox.change("value3");
	expect(component1.text).toEqual("value2");
	expect(component1.counter).toEqual(2);
	expect(externalValue).toEqual("value3");
});

it('EventEmitter.listenToOnce success', () => {
	const component1 = new Component();

	let externalValue: string | undefined;
	component1.textbox.on("change", (value: string) => {
		externalValue = value;
	});

	component1.test_listenToOnce();

	component1.textbox.change("value");
	expect(component1.text).toEqual("value");
	expect(component1.counter).toEqual(1);
	expect(externalValue).toEqual("value");

	component1.textbox.change("value2");
	expect(component1.text).toEqual("value");
	expect(component1.counter).toEqual(1);
	expect(externalValue).toEqual("value2");
});

it('EventEmitter.listenToOnce releases tracking once it fires', () => {
	const component1 = new Component();
	component1.test_listenToOnce();
	expect(component1.listeningTo).not.toBeUndefined();
	expect(component1.textbox.events["change"].length).toEqual(1);

	component1.textbox.change("value"); // one-shot fires

	// the spent subscription is dropped from BOTH sides (no dangling tracking)
	expect(component1.listeningTo).toBeUndefined();
	expect(component1.textbox.events["change"]).toBeUndefined();
});

it('EventEmitter.listenToOnce firing does not orphan a co-registered listenTo', () => {
	const c = new MixedComponent();
	c.listenMixed(); // listenTo + listenToOnce on the SAME source + event

	c.textbox.change("v1"); // both fire; the one-shot removes itself
	expect(c.persistent).toEqual(1);
	expect(c.onceCount).toEqual(1);

	c.textbox.change("v2"); // only the persistent listener remains
	expect(c.persistent).toEqual(2);
	expect(c.onceCount).toEqual(1);

	// the persistent subscription is still tracked, so destroy cleans it up fully
	c.destroy();
	expect(c.listeningTo).toBeUndefined();
	expect(c.textbox.events["change"]).toBeUndefined();

	c.textbox.change("v3"); // nothing dangling fires on the destroyed listener
	expect(c.persistent).toEqual(2);
});

it('EventEmitter.listenTo destroy listening', () => {
	const component1 = new Component();

	let externalValue: string | undefined;
	component1.textbox.on("change", (value: string) => {
		externalValue = value;
	});

	component1.test_listenTo();
	component1.destroy();

	expect(component1.listeningTo).toBeUndefined();

	component1.textbox.change("value");
	expect(component1.text).toBeUndefined();
	expect(externalValue).toEqual("value");
});

it('EventEmitter.listenTo destroy listener', () => {
	const component1 = new Component();

	let externalValue: string | undefined;
	component1.textbox.on("change", (value: string) => {
		externalValue = value;
	});

	component1.test_listenTo();
	component1.textbox.destroy();

	expect(component1.listeningTo).toBeUndefined();

	component1.textbox.change("value");
	expect(component1.text).toBeUndefined();
	expect(externalValue).toBeUndefined();
});

it('EventEmitter.listenTo same event twice fires both callbacks', () => {
	const c = new MultiComponent();
	c.listenBoth();

	c.textbox.change("v1");
	expect(c.a).toEqual(1);
	expect(c.b).toEqual(1);

	// stopListening by event removes both
	c.stopListenChange();
	c.textbox.change("v2");
	expect(c.a).toEqual(1);
	expect(c.b).toEqual(1);
});

class Fake extends EventEmitter {
	get listenId(): string { return (<any>this)._listenId; }
	get listeningTo(): { [id: string]: { emitter: EventEmitter, subscriptions: { eventName: string, callback: Function, origin: Function }[] } } { return (<any>this)._listeningTo; }
	get events(): { [key: string]: { callback: EventCallbackFunc, context?: EventContextInit, ctx: EventContextInit }[] } { return (<any>this)._events; }

	destroy(): void {
		super.stopEvents();
	}
}

class Component extends Fake {
	readonly textbox: TextBox = new TextBox();

	test_listenTo() {
		this.listenTo(this.textbox, "change", this.changed);
	}

	test_listenToOnce() {
		this.listenToOnce(this.textbox, "change", this.changed);
	}

	stopListenChange() {
		this.stopListening(this.textbox, "change");
	}

	text?: string;
	counter: number = 0;
	private changed(value: string) {
		this.text = value;
		this.counter++;
	}
}

class TextBox extends Fake {
	change(value: string) {
		this.trigger("change", value);
	}
}

class MultiComponent extends Fake {
	readonly textbox: TextBox = new TextBox();
	a = 0;
	b = 0;

	listenBoth() {
		this.listenTo(this.textbox, "change", () => this.a++);
		this.listenTo(this.textbox, "change", () => this.b++);
	}

	stopListenChange() {
		this.stopListening(this.textbox, "change");
	}
}

class MixedComponent extends Fake {
	readonly textbox: TextBox = new TextBox();
	persistent = 0;
	onceCount = 0;

	listenMixed() {
		this.listenTo(this.textbox, "change", () => this.persistent++);
		this.listenToOnce(this.textbox, "change", () => this.onceCount++);
	}
}