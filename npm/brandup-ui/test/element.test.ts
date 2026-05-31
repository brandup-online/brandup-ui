import { UIElement } from "../source/index";

it('UIElement check instanceof', () => {
	const elem = new Test();

	expect(true).toEqual(elem instanceof UIElement);
});

it('UIElement on destroy callback', () => {
	const elem = new Test();
	const elem2 = new Test();

	elem.on("destroy", () => elem2.destroy());
	let isDestroy = false;
	elem.on("destroy", () => { isDestroy = true });

	expect(elem2.element).toBeDefined();

	elem.destroy();

	expect(elem2.element).toBeUndefined();
	expect(isDestroy).toBeTruthy();
});

class Test extends UIElement {
	typeName = "test";

	constructor() {
		super();

		this.setElement(document.createElement("div"));

		this.element?.remove();
	}
}