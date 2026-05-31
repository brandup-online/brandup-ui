import { EventEmitter } from "../source/index";

interface CounterEvents {
	increment: (by: number) => void;
	reset: () => void;
}

class Counter extends EventEmitter<CounterEvents> {
	value = 0;

	add(n: number) {
		this.value += n;
		this.trigger("increment", n);
	}

	clear() {
		this.value = 0;
		this.trigger("reset");

		// @ts-expect-error wrong argument type for "increment" (checked by tsc, never executed)
		if ((false as boolean)) this.trigger("increment", "x");
		// @ts-expect-error unknown event name
		if ((false as boolean)) this.trigger("nope");
	}
}

it("typed EventEmitter subclass triggers and receives typed events", () => {
	const c = new Counter();

	let received = 0;
	c.on("increment", by => { received += by; }); // by: number
	let resets = 0;
	c.on("reset", () => { resets++; });

	c.add(5);
	c.add(3);
	expect(received).toEqual(8);

	c.clear();
	expect(resets).toEqual(1);

	// @ts-expect-error unknown event name
	c.on("nope", () => { });
	// @ts-expect-error wrong callback argument type
	c.on("increment", (by: string) => { void by; });
});
