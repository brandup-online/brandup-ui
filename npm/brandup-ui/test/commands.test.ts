import { UIElement, UIElementBound, CommandResult } from "../source/index";

class BoundWidget extends UIElementBound {
	constructor(elem: HTMLElement) {
		super("bound-widget", elem);
	}
}

it("UIElementBound binds the element in the constructor (element is always defined)", () => {
	const root = document.createElement("div");
	document.body.appendChild(root);

	const w = new BoundWidget(root);

	// element is HTMLElement, not undefined — usable without ?./!
	const el: HTMLElement = w.element;
	expect(el).toEqual(root);
	expect(w.typeName).toEqual("bound-widget");
	expect(UIElement.hasElement(root)).toBeTruthy();

	let called = 0;
	w.registerCommand("go", () => { called++; });

	const btn = document.createElement("button");
	btn.dataset.command = "go";
	w.element.appendChild(btn);
	btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
	expect(called).toEqual(1);

	document.body.removeChild(root);
});

class TestElem extends UIElement {
	typeName = "test";

	constructor(elem?: HTMLElement) {
		super();
		this.setElement(elem ?? document.createElement("div"));
	}

	exec(name: string, target: HTMLElement): CommandResult {
		return (<any>this).__execCommand(name, target);
	}
}

class GuardElem extends TestElem {
	protected override _onCanExecCommand(): boolean {
		return false;
	}
}

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

it("registerCommand + hasCommand is case-insensitive", () => {
	const e = new TestElem();
	e.registerCommand("Cmd", () => { });

	expect(e.hasCommand("cmd")).toBeTruthy();
	expect(e.hasCommand("CMD")).toBeTruthy();
	expect(e.hasCommand("other")).toBeFalsy();
});

it("registerCommand throws on duplicate name", () => {
	const e = new TestElem();
	e.registerCommand("cmd", () => { });

	expect(() => e.registerCommand("CMD", () => { })).toThrow();
});

it("execCommand success runs handler and returns context", () => {
	const e = new TestElem();
	let called = 0;
	e.registerCommand("cmd", () => { called++; });

	const target = document.createElement("button");
	const result = e.exec("cmd", target);

	expect(result.status).toEqual("success");
	expect(result.context.target).toEqual(target);
	expect(result.context.uiElem).toEqual(e);
	expect(called).toEqual(1);
});

it("execCommand throws for unknown command", () => {
	const e = new TestElem();
	e.registerCommand("cmd", () => { });

	expect(() => e.exec("missing", document.createElement("button"))).toThrow();
});

it("execCommand disallow when canExecute returns false", () => {
	const e = new TestElem();
	let called = 0;
	e.registerCommand("cmd", () => { called++; }, () => false);

	const result = e.exec("cmd", document.createElement("button"));

	expect(result.status).toEqual("disallow");
	expect(called).toEqual(0);
});

it("execCommand disallow when _onCanExecCommand returns false", () => {
	const e = new GuardElem();
	let called = 0;
	e.registerCommand("cmd", () => { called++; });

	const result = e.exec("cmd", document.createElement("button"));

	expect(result.status).toEqual("disallow");
	expect(called).toEqual(0);
});

it("async command toggles executing class and blocks re-entry", async () => {
	const e = new TestElem();
	let resolveFn!: () => void;
	e.registerCommand("cmd", () => new Promise<void>(r => { resolveFn = r; }));

	const target = document.createElement("button");
	const result = e.exec("cmd", target);

	expect(result.status).toEqual("success");
	expect(target.classList.contains("executing")).toBeTruthy();

	const reentry = e.exec("cmd", target);
	expect(reentry.status).toEqual("already");

	resolveFn();
	await flush();

	expect(target.classList.contains("executing")).toBeFalsy();
});

it("command runs via DOM click resolving through ancestors", () => {
	const root = document.createElement("div");
	document.body.appendChild(root);

	const e = new TestElem(root);
	let called = 0;
	e.registerCommand("cmd", () => { called++; });

	const btn = document.createElement("button");
	btn.dataset.command = "cmd";
	root.appendChild(btn);

	btn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

	expect(called).toEqual(1);

	document.body.removeChild(root);
});

it("a click on a command anchor is prevented even when the command throws", () => {
	const root = document.createElement("div");
	document.body.appendChild(root);

	const e = new TestElem(root);
	e.registerCommand("cmd", () => { throw new Error("command boom"); });

	const link = document.createElement("a");
	link.setAttribute("href", "");
	link.dataset.command = "cmd";
	root.appendChild(link);

	const errSpy = jest.spyOn(console, "error").mockImplementation(() => { });
	const event = new MouseEvent("click", { bubbles: true, cancelable: true });
	link.dispatchEvent(event);

	// the link's default navigation must be prevented despite the command throwing,
	// and the failure must be reported (not silently swallowed)
	expect(event.defaultPrevented).toBe(true);
	expect(errSpy).toHaveBeenCalled();
	errSpy.mockRestore();

	document.body.removeChild(root);
});

it("throwing canExecute does not leave the command stuck", () => {
	const e = new TestElem();
	let shouldThrow = true;
	let called = 0;
	e.registerCommand("cmd", () => { called++; }, () => {
		if (shouldThrow)
			throw new Error("guard error");
		return true;
	});

	const target = document.createElement("button");
	expect(() => e.exec("cmd", target)).toThrow("guard error");

	// must not be stuck in isExecuting after the throw
	shouldThrow = false;
	const result = e.exec("cmd", target);
	expect(result.status).toEqual("success");
	expect(called).toEqual(1);
});

it("async command rejection clears executing state and stays reusable", async () => {
	const e = new TestElem();
	let rejectFn!: (reason?: any) => void;
	e.registerCommand("cmd", () => new Promise<void>((_resolve, reject) => { rejectFn = reject; }));

	const target = document.createElement("button");
	const result = e.exec("cmd", target);
	expect(result.status).toEqual("success");
	expect(target.classList.contains("executing")).toBeTruthy();

	rejectFn(new Error("boom"));
	await flush();

	// executing class removed, command not stuck, no unhandled rejection
	expect(target.classList.contains("executing")).toBeFalsy();
	expect(e.exec("cmd", target).status).toEqual("success");
});

it("registerCommand after destroy is a no-op", () => {
	const e = new TestElem();
	e.destroy();

	e.registerCommand("cmd", () => { });
	expect(e.hasCommand("cmd")).toBeFalsy();
});
