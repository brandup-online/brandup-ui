import { UIElement, CommandResult } from "../source/index";

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

it("registerCommand after destroy is a no-op", () => {
	const e = new TestElem();
	e.destroy();

	e.registerCommand("cmd", () => { });
	expect(e.hasCommand("cmd")).toBeFalsy();
});
