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
	expect(component1.listeningTo[component1.textbox.listenId].emmiter).toEqual(component1.textbox);
	expect(component1.listeningTo[component1.textbox.listenId].events).toContain("change");

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

class Fake extends EventEmitter {
	get listenId(): string { return (<any>this)._listenId; }
	get listeningTo(): { [id: string]: { emmiter: EventEmitter, events: string[] } } { return (<any>this)._listeningTo; }
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