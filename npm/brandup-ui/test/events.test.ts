import { EventEmitter, EventCallbackFunc, EventContextInit } from "../source/events"

it('EventEmitter.on success', () => {
	const component = new Component();

	let event_ok = 0;
	const onEvent1 = () => event_ok++;
	component.on("event", onEvent1);

	let event_ok2 = 0;
	const onEvent2 = () => event_ok2++;
	component.on("event", onEvent2);

	expect(component.events).not.toBeUndefined();
	expect(component.events["event"]).not.toBeUndefined();
	expect(component.events["event"].length).toEqual(2);
	expect(component.events["event"][0].callback).toEqual(onEvent1);
	expect(component.events["event"][0].context).toBeUndefined();
	expect(component.events["event"][0].ctx).toEqual(component);
	expect(component.events["event"][1].callback).toEqual(onEvent2);

	component.trigger("event");
	expect(event_ok).toEqual(1);
	expect(event_ok2).toEqual(1);

	component.trigger("event");
	expect(event_ok).toEqual(2);
	expect(event_ok2).toEqual(2);

	component.trigger("event_other");
	expect(event_ok).toEqual(2);
	expect(event_ok2).toEqual(2);
});

it('EventEmitter.on success all', () => {
	const component = new Component();

	let event_ok = 0;
	const onEvent1 = () => event_ok++;
	component.on("all", onEvent1);

	component.trigger("event1");
	expect(event_ok).toEqual(1);

	component.trigger("event2");
	expect(event_ok).toEqual(2);

	component.trigger("event3");
	expect(event_ok).toEqual(3);
});

it('EventEmitter.on with context success', () => {
	const component = new Component();

	const component2 = new Component2();
	component.on("event", component2.callback, component2);

	expect(component.events).not.toBeUndefined();
	expect(component.events["event"]).not.toBeUndefined();
	expect(component.events["event"].length).toEqual(1);
	expect(component.events["event"][0].callback).toEqual(component2.callback);
	expect(component.events["event"][0].context).toEqual(component2);
	expect(component.events["event"][0].ctx).toEqual(component2);

	component.trigger("event", "value", 10);
	expect(component2.arg1).toEqual("value");
	expect(component2.arg2).toEqual(10);
});

it('EventEmitter.off by event name and callback', () => {
	const component = new Component();

	const onEvent1 = () => { };
	component.on("event", onEvent1);

	component.off("event", onEvent1)
	expect(Object.keys(component.events).length).toEqual(0);

	// with context
	const context = {};
	component.on("event", onEvent1, context);

	component.off("event", onEvent1, context)
	expect(Object.keys(component.events).length).toEqual(0);
});

it('EventEmitter.off by event name', () => {
	const component = new Component();

	const onEvent1 = () => { };
	component.on("event", onEvent1);

	component.off("event");
	expect(Object.keys(component.events).length).toEqual(0);

	// with context
	const context = {};
	component.on("event", onEvent1, context);

	component.off("event", null, context)
	expect(Object.keys(component.events).length).toEqual(0);
});

it('EventEmitter.off by callback', () => {
	const component = new Component();

	const onEvent1 = () => { };
	component.on("event", onEvent1);

	component.off(null, onEvent1);
	expect(Object.keys(component.events).length).toEqual(0);

	// with context
	const context = {};
	component.on("event", onEvent1, context);

	component.off(null, onEvent1, context)
	expect(Object.keys(component.events).length).toEqual(0);
});

it('EventEmitter.off by only context', () => {
	const component = new Component();

	const onEvent1 = () => { };

	// with context
	const context = {};
	component.on("event", onEvent1, context);
	component.on("event5", () => { }, context);

	component.off(null, null, context)
	expect(Object.keys(component.events).length).toEqual(0);
});

it('EventEmitter.once success', () => {
	const component = new Component();

	let event1_ok = 0;
	component.once("event1", () => {
		event1_ok++;
	});

	component.trigger("event1");
	expect(event1_ok).toEqual(1);

	console.log(component.events);

	expect(Object.keys(component.events).length).toEqual(0);

	component.trigger("event1");
	expect(event1_ok).toEqual(1);
});

it('EventEmitter.once with context success', () => {
	const component = new Component();

	const component2 = new Component2();
	component.once("event1", component2.callback, component2);

	component.trigger("event1", "value", 10);
	expect(component2.arg1).toEqual("value");
	expect(component2.arg2).toEqual(10);

	delete component2.arg1;
	delete component2.arg2;

	component.trigger("event1", "value", 10);
	expect(component2.arg1).toBeUndefined();
	expect(component2.arg2).toBeUndefined();
});

it('EventEmitter.trigger empty events', () => {
	const component = new Component();

	component.trigger("event1");
	component.trigger("event2");
});

it('EventEmitter.trigger with args to on', () => {
	const component = new Component();

	let arg1_ok: string | undefined;
	let arg2_ok: number | undefined;
	component.on("event1", (arg1: string, arg2: number) => {
		arg1_ok = arg1;
		arg2_ok = arg2;
	});

	component.trigger("event1", "value", 10);
	expect(arg1_ok).toEqual("value");
	expect(arg2_ok).toEqual(10);
});

it('EventEmitter.trigger with args to once', () => {
	const component = new Component();

	let arg1_ok: string | undefined;
	let arg2_ok: number | undefined;
	component.once("event1", (arg1: string, arg2: number) => {
		arg1_ok = arg1;
		arg2_ok = arg2;
	});

	component.trigger("event1", "value", 10);
	expect(arg1_ok).toEqual("value");
	expect(arg2_ok).toEqual(10);
});

class Component extends EventEmitter {
	get events(): { [key: string]: { callback: EventCallbackFunc, context?: EventContextInit, ctx: EventContextInit }[] } { return (<any>this)._events; }

	override trigger(eventName: string, ...args: any[]): this {
		return super.trigger(eventName, ...args);
	}
}

class Component2 extends EventEmitter {
	arg1?: string;
	arg2?: number;
	callback(arg1?: string, arg2?: number) {
		this.arg1 = arg1;
		this.arg2 = arg2;
	}
}