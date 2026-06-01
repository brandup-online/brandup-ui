import { DOM } from "@brandup/ui-dom";
import { Page } from "../../page";

export default class CommandsPage extends Page {
	get typeName(): string { return "AboutModel" }
	get header(): string { return "Commands" }

	// drives the page-wide _onCanExecCommand gate (test #4 below)
	private __hookCheckbox?: HTMLInputElement;

	protected async onRenderContent(container: HTMLElement) {
		this.renderCommandLogicTests(container);
	}

	/**
	 * Manual tests for the core command logic. Each link triggers a command; the
	 * outcome (and the built-in "command" event) is written to the log panel so the
	 * behaviour can be verified by hand in the browser.
	 */
	private renderCommandLogicTests(container: HTMLElement) {
		const log = DOM.tag("pre", {
			class: "command-log",
			styles: { maxHeight: "180px", overflow: "auto", background: "#f5f5f5", border: "1px solid #ddd", padding: "8px", marginTop: "8px" }
		});
		let seq = 0;
		const write = (msg: string) => {
			log.textContent += `#${++seq}  ${msg}\n`;
			log.scrollTop = log.scrollHeight;
		};

		// the "command" event is raised for every command that passes its guards, right before it runs
		this.on("command", (args) => write(`event "command" → ${args.name}`));

		const gate = DOM.tag("input", { type: "checkbox", id: "logic-gate" });
		this.__hookCheckbox = DOM.tag("input", { type: "checkbox", id: "logic-hook" });

		const link = (command: string, title: string) => DOM.tag("a", { href: "", command }, title);

		// one test row: the interactive controls on top, a purpose description below
		const item = (controls: any, desc: string) => DOM.tag("div", { class: "item", styles: { marginBottom: "12px" } },
			DOM.tag("div", null, controls),
			DOM.tag("small", { styles: { display: "block", color: "#666" } }, desc)
		);

		container.appendChild(DOM.tag("div", { class: "command-logic" },
			DOM.tag("h3", null, "Command logic — manual tests"),
			DOM.tag("div", { class: "list" },
				item(
					link("logic-basic", "1. basic execute → 'ok'"),
					"Purpose: a registered sync command runs on click. The handler writes 'ok' into its target; the built-in \"command\" event is logged just before execution."),
				item(
					link("logic-cant", "2. canExecute=false → must NOT run"),
					"Purpose: a command whose canExecute always returns false is gated out — the handler never runs and no \"command\" event appears (status 'disallow')."),
				item(
					[gate, DOM.tag("label", { for: "logic-gate" }, " allow "), link("logic-gated", "3. dynamic canExecute (toggle 'allow')")],
					"Purpose: canExecute is re-evaluated on every click. With 'allow' unchecked the command is blocked; checking it lets the command run."),
				item(
					[this.__hookCheckbox, DOM.tag("label", { for: "logic-hook" }, " block "), link("logic-hooked", "4. _onCanExecCommand hook (toggle 'block')")],
					"Purpose: the page-wide _onCanExecCommand override gates commands at the element level. While 'block' is checked it denies this command (independently of its own canExecute)."),
				item(
					link("logic-async", "5. async 2s — re-click while running ⇒ 'already' (one run)"),
					"Purpose: a command returning a promise keeps the 'executing' CSS class while pending, and is re-entrancy-guarded — clicking again during execution is ignored (status 'already'), so the run counter stays at one."),
				item(
					link("logic-async-fail", "6. async reject ⇒ console.error + 'executing' class cleared"),
					"Purpose: a rejected async command is reported via console.error (not silently swallowed) and the 'executing' class is removed. The page must NOT reload."),
				item(
					link("logic-throw", "7. sync throw"),
					"Purpose: a handler that throws synchronously is logged, and the click is still prevented — the <a href> must NOT navigate or reload the page."),
				item(
					DOM.tag("span", null, DOM.tag("b", null, link("logic-nested", "8. command on a nested element (handler walks up)"))),
					"Purpose: data-command sits on a deeply nested element; the owning UIElement is found by walking up the DOM. The logged target shows which tag was clicked."),
			),
			log
		));

		// 1. basic synchronous execution
		this.registerCommand("logic-basic", (context) => { context.target.textContent = "ok"; write("logic-basic executed"); });

		// 2. static canExecute === false → command is gated out, never runs
		this.registerCommand("logic-cant", () => write("logic-cant RAN (should never happen!)"), () => false);

		// 3. dynamic canExecute driven by the checkbox
		this.registerCommand("logic-gated", () => write("logic-gated executed"), () => gate.checked);

		// 4. gated by the page-wide _onCanExecCommand hook (see override below)
		this.registerCommand("logic-hooked", () => write("logic-hooked executed"));

		// 5. async command: "executing" class is applied while pending; a second click
		// while still running is ignored (status "already"), so run count stays at one
		let asyncRuns = 0;
		this.registerCommand("logic-async", () => {
			write(`logic-async START (run #${++asyncRuns})`);
			return new Promise<void>(resolve => window.setTimeout(() => { write("logic-async DONE"); resolve(); }, 2000));
		});

		// 6. rejected async command: error is logged (not swallowed), executing class cleared
		this.registerCommand("logic-async-fail", () => {
			write("logic-async-fail START → rejecting");
			return Promise.reject(new Error("intentional async failure"));
		});

		// 7. synchronous throw
		this.registerCommand("logic-throw", () => { write("logic-throw → throwing"); throw new Error("intentional sync throw"); });

		// 8. command declared on a nested element — the handler is resolved by walking up the DOM
		this.registerCommand("logic-nested", (context) => write(`logic-nested executed (target=<${context.target.tagName.toLowerCase()}>)`));
	}

	protected override _onCanExecCommand(name: string, _elem: HTMLElement): boolean {
		// page-wide gate: block only "logic-hooked" while its checkbox is checked
		if (name === "logic-hooked" && !!this.__hookCheckbox?.checked)
			return false;
		return true;
	}
}