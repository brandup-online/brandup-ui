import { Application, EnvironmentModel } from "@brandup/ui-app";
import { ExampleApplicationModel } from "./typings/app";
import { DOM } from "@brandup/ui-dom";

import logoIcon from "./svg/logo.svg";

export class ExampleApplication extends Application<ExampleApplicationModel> {
	readonly contentElem: HTMLElement;

	constructor(env: EnvironmentModel, model: ExampleApplicationModel, ...args: any[]) {
		super(env, model, args);

		this.contentElem = DOM.tag("main", { role: "main", class: "app-content content-width" });
	}

	protected async onStared() {
		await super.onStared();

		const layoutElem = DOM.tag("div", "app", [
			DOM.tag("nav", { class: "app-nav", role: "navigation" },
				DOM.tag("div", "content-width", [
					DOM.tag("a", { class: "logo", title: "brandup-ui" }, [logoIcon, DOM.tag("span", null, "UI")]).navUrl("/"),
					DOM.tag("menu", null, [
						DOM.tag("li", null, DOM.tag("a", null, "My account").navUrl("/account")),
						() => {
							if (this.env.basePath === '') {
								return [
									DOM.tag("li", null, DOM.tag("a", null, "Commands").nav(this, "/commands")),
									DOM.tag("li", null, DOM.tag("a", null, "Navigation").nav(this, "/navigation")),
									DOM.tag("li", null, DOM.tag("a", null, "Forms").nav(this, "/forms")),
									DOM.tag("li", null, DOM.tag("a", null, "Ajax").nav(this, "/ajax"))
								];
							}
							return null;
						}
					])
				])
			),
			this.contentElem
		]);

		this.element?.insertAdjacentElement("beforeend", layoutElem);
	}
}