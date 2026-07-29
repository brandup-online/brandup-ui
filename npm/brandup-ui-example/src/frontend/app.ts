import { Application, EnvironmentModel } from "@brandup/ui-app";
import type { ExampleApplicationModel } from "./typings/app";
import { DOM, reactive, bind } from "@brandup/ui";

import logoIcon from "./svg/logo.svg";

interface MenuItem {
	title: string;
	url: string;
}

export class ExampleApplication extends Application<ExampleApplicationModel> {
	readonly contentElem: HTMLElement;
	private readonly state = reactive({ menu: [] as MenuItem[] });

	constructor(env: EnvironmentModel, model: ExampleApplicationModel, ...args: any[]) {
		super(env, model, args);

		this.contentElem = DOM.tag("main", { role: "main", class: "app-content content-width" });

		const menu: MenuItem[] = [{ title: "My account", url: "/account" }];
		if (this.env.basePath === '')
			menu.push(
				{ title: "Commands", url: "/commands" },
				{ title: "Navigation", url: "/navigation" },
				{ title: "Forms", url: "/forms" },
				{ title: "Ajax", url: "/ajax" }
			);
		this.state.menu = menu;
	}

	protected override async onStared() {
		await super.onStared();

		const layoutElem = DOM.tag("div", { class: "app" },
			DOM.tag("nav", { class: "app-nav", role: "navigation" },
				DOM.tag("div", { class: "content-width" },
					DOM.tag("a", { class: "logo", title: "brandup-ui" }, logoIcon, DOM.tag("span", null, "UI")).navUrl("/"),
					// reactive: the menu is rendered from state.menu and re-renders when it changes
					bind(() => DOM.tag("menu", null,
						this.state.menu.map(item => DOM.tag("li", null, DOM.tag("a", null, item.title).navUrl(item.url)))
					))
				)
			),
			this.contentElem);

		this.element?.insertAdjacentElement("beforeend", layoutElem);
	}
}
