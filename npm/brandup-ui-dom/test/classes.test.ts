import { DOM } from "../source/index";

it("DOM.addClass many", () => {
	const child = DOM.tag("div", ["zero"]);

	DOM.addClass(DOM.tag("div", null, child), ".zero", ["class1", "class2"]);

	expect(3).toEqual(child.classList.length);
});

it("DOM.addClass single", () => {
	const child = DOM.tag("div", ["zero"]);

	DOM.addClass(DOM.tag("div", null, child), ".zero", "class2");

	expect(2).toEqual(child.classList.length);
});

it("DOM.addClass none", () => {
	const child = DOM.tag("div", ["zero"]);

	DOM.addClass(DOM.tag("div", null, child), ".zero", "");
	DOM.addClass(DOM.tag("div", null, child), ".zero", []);

	expect(1).toEqual(child.classList.length);
});

it("DOM.removeClass many", () => {
	const child = DOM.tag("div", ["class1", "class2"]);

	DOM.removeClass(DOM.tag("div", null, child), ".class1", ["class1", "class2"]);

	expect(0).toEqual(child.classList.length);
});

it("DOM.removeClass single", () => {
	const child = DOM.tag("div", ["class1", "class2"]);
	DOM.removeClass(DOM.tag("div", null, child), ".class1", "class2");

	expect(1).toEqual(child.classList.length);
});

it("DOM.removeClass none", () => {
	const child = DOM.tag("div", ["class1", "class2"]);
	DOM.removeClass(DOM.tag("div", null, child), ".class1", "");
	DOM.removeClass(DOM.tag("div", null, child), ".class1", []);

	expect(2).toEqual(child.classList.length);
});