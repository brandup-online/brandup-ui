import { DOM } from "../source/index";

it("DOM.addClass many", () => {
	const child = DOM.tag("div", { class: "zero" });

	DOM.addClass(DOM.tag("div", null, child), ".zero", ["class1", "class2"]);

	expect(3).toEqual(child.classList.length);
});

it("DOM.addClass single", () => {
	const child = DOM.tag("div", { class: "zero" });

	DOM.addClass(DOM.tag("div", null, child), ".zero", "class2 test");

	expect(3).toEqual(child.classList.length);
});

it("DOM.addClass none", () => {
	const child = DOM.tag("div", { class: "zero" });

	DOM.addClass(DOM.tag("div", null, child), ".zero", "");
	DOM.addClass(DOM.tag("div", null, child), ".zero", []);

	expect(1).toEqual(child.classList.length);
});

it("DOM.removeClass many", () => {
	const child = DOM.tag("div", { class: ["class1", "class2"] });

	DOM.removeClass(DOM.tag("div", null, child), ".class1", ["class1", "class2"]);

	expect(0).toEqual(child.classList.length);
});

it("DOM.removeClass single", () => {
	const child = DOM.tag("div", { class: ["class1", "class2"] });
	DOM.removeClass(DOM.tag("div", null, child), ".class1", "class2");

	expect(1).toEqual(child.classList.length);
});

it("DOM.removeClass none", () => {
	const child = DOM.tag("div", { class: ["class1", "class2"] });
	DOM.removeClass(DOM.tag("div", null, child), ".class1", "");
	DOM.removeClass(DOM.tag("div", null, child), ".class1", []);

	expect(2).toEqual(child.classList.length);
});

// Regression: class strings with extra/leading/trailing spaces must not throw
// (empty tokens previously reached classList.add → "The token must not be empty").
it("tag class with collapsed/leading/trailing spaces does not throw", () => {
	let elem!: HTMLElement;
	expect(() => { elem = DOM.tag("div", { class: "  a   b  " }); }).not.toThrow();
	expect(elem.classList.contains("a")).toBe(true);
	expect(elem.classList.contains("b")).toBe(true);
	expect(elem.classList.length).toBe(2);
});

it("DOM.addClass with collapsed spaces ignores empty tokens", () => {
	const child = DOM.tag("div", { class: "zero" });
	DOM.addClass(DOM.tag("div", null, child), ".zero", "class1  class2 ");

	expect(child.classList.length).toBe(3);
});

it("DOM.removeClass with collapsed spaces ignores empty tokens", () => {
	const child = DOM.tag("div", { class: ["class1", "class2", "class3"] });
	DOM.removeClass(DOM.tag("div", null, child), ".class1", " class1  class2 ");

	expect(child.classList.length).toBe(1);
	expect(child.classList.contains("class3")).toBe(true);
});
