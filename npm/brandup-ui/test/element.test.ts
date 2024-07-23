import { UIElement } from "../source/index";

it('UIElement check instanceof', () => {
	const elem = new Test();

	expect(true).toEqual(elem instanceof UIElement);
});

class Test extends UIElement {
	typeName = "test";
}