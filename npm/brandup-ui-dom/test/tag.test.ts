import { DOM, TagChildrenLike } from "../source/index";

it('DOM.tag only tag name', () => {
	const elem = DOM.tag("div");

	expect("DIV").toEqual(elem.tagName);
});

it('DOM.tag with class', () => {
	let elem = DOM.tag("div", "test");
	expect(1).toEqual(elem.classList.length);
	expect(true).toEqual(elem.classList.contains("test"));

	elem = DOM.tag("div", ["test1", "test2"]);
	expect(2).toEqual(elem.classList.length);
	expect(true).toEqual(elem.classList.contains("test1"));
	expect(true).toEqual(elem.classList.contains("test2"));
});

it('DOM.tag with options', () => {
	let isClicked = false;
	let elem = DOM.tag("div", {
		id: "id",
		class: "class",
		dataset: { "param": "value" },
		events: { "click": () => isClicked = true },
		styles: { fontSize: "10px" },
		command: "go",
		custom: "value"
	});

	expect("id").toEqual(elem.id);
	expect(1).toEqual(elem.classList.length);
	expect(true).toEqual(elem.classList.contains("class"));
	expect("value").toEqual(elem.dataset.param);
	expect("value").toEqual(elem.getAttribute("data-param"));
	expect("10px").toEqual(elem.style.fontSize);
	expect("go").toEqual(elem.getAttribute("data-command"));
	expect("value").toEqual(elem.getAttribute("custom"));

	elem.click();
	expect(true).toEqual(isClicked);
});

it('DOM.tag with single children', async () => {
	let child: TagChildrenLike = "<b>test</b>";
	let elem = DOM.tag("div", null, child);
	expect(child).toEqual(elem.innerHTML);

	child = 10;
	elem = DOM.tag("div", null, child);
	expect("10").toEqual(elem.innerHTML);

	child = null;
	elem = DOM.tag("div", null, child);
	expect("").toEqual(elem.innerHTML);

	child = undefined;
	elem = DOM.tag("div", null, child);
	expect("").toEqual(elem.innerHTML);

	child = DOM.tag("div");
	elem = DOM.tag("div", null, child);
	expect(child.outerHTML).toEqual(elem.innerHTML);

	child = (elem: HTMLElement) => { elem.innerHTML = "test"; };
	elem = DOM.tag("div", null, child);
	expect("test").toEqual(elem.innerHTML);

	child = (_elem: HTMLElement) => { return DOM.tag("div"); };
	elem = DOM.tag("div", null, child);
	expect("<div></div>").toEqual(elem.innerHTML);

	child = () => { return "test"; };
	elem = DOM.tag("div", null, child);
	expect("test").toEqual(elem.innerHTML);

	child = () => { return 10; };
	elem = DOM.tag("div", null, child);
	expect("10").toEqual(elem.innerHTML);

	let func: () => Promise<any> = child = () => { return new Promise<string>(resolve => resolve("test")); };
	elem = DOM.tag("div", null, child);
	await func();
	expect("test").toEqual(elem.innerHTML);

	func = child = () => { return new Promise<HTMLElement>(resolve => resolve(DOM.tag("div"))); };
	elem = DOM.tag("div", null, child);
	await func();
	expect("<div></div>").toEqual(elem.innerHTML);

	let promis = child = new Promise<HTMLElement>(resolve => resolve(DOM.tag("div")));
	elem = DOM.tag("div", null, child);
	await promis;
	expect("<div></div>").toEqual(elem.innerHTML);
});

it('DOM.tag with many children', async () => {
	let child: TagChildrenLike = "<b>test</b>";
	let elem = DOM.tag("div", null, [child]);
	expect(child).toEqual(elem.innerHTML);

	child = 10;
	elem = DOM.tag("div", null, [child]);
	expect("10").toEqual(elem.innerHTML);

	child = null;
	elem = DOM.tag("div", null, [child]);
	expect("").toEqual(elem.innerHTML);

	child = undefined;
	elem = DOM.tag("div", null, [child]);
	expect("").toEqual(elem.innerHTML);

	child = DOM.tag("div");
	elem = DOM.tag("div", null, [child]);
	expect(child.outerHTML).toEqual(elem.innerHTML);

	child = (elem: HTMLElement) => { elem.innerHTML = "test"; };
	elem = DOM.tag("div", null, [child]);
	expect("test").toEqual(elem.innerHTML);

	child = (_elem: HTMLElement) => { return DOM.tag("div"); };
	elem = DOM.tag("div", null, [child]);
	expect("<div></div>").toEqual(elem.innerHTML);

	child = () => { return "test"; };
	elem = DOM.tag("div", null, [child]);
	expect("test").toEqual(elem.innerHTML);

	child = () => { return 10; };
	elem = DOM.tag("div", null, [child]);
	expect("10").toEqual(elem.innerHTML);

	let func: () => Promise<any> = child = () => { return new Promise<string>(resolve => resolve("test")); };
	elem = DOM.tag("div", null, [child]);
	await func();
	expect("test").toEqual(elem.innerHTML);

	func = child = () => { return new Promise<HTMLElement>(resolve => resolve(DOM.tag("div"))); };
	elem = DOM.tag("div", null, [child]);
	await func();
	expect("<div></div>").toEqual(elem.innerHTML);

	let promis = child = new Promise<HTMLElement>(resolve => resolve(DOM.tag("div")));
	elem = DOM.tag("div", null, [child]);
	await promis;
	expect("<div></div>").toEqual(elem.innerHTML);
});