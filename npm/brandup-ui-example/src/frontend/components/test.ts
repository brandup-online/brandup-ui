import { UIElement } from "@brandup/ui";
import { DOM } from "@brandup/ui-dom";

class TestElem extends UIElement {
	get typeName(): string { return "Components.Test"; }

	constructor(container: HTMLElement) {
		super();

		const elem = DOM.tag("div", null, "test component");
		this.setElement(elem);

		container.insertAdjacentElement("beforeend", elem);
	}

	destroy() {
		alert("destroy");

		this.element?.remove();

		super.destroy();
	}
}

export default TestElem;