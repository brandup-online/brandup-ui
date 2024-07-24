import { ElementOptions, CssClass, TagChildrenLike, TagChildrenPrimitive } from "./types";
import helpers from "./helpers";

function tag<TElement extends keyof HTMLElementTagNameMap>(tagName: TElement, options?: ElementOptions | CssClass | null, children?: TagChildrenLike | Array<TagChildrenLike>): HTMLElementTagNameMap[TElement] {
	const elem = document.createElement(tagName);

	applyOptions(elem, options);

	if (children instanceof Array)
		children.forEach(child => appendChild(elem, "beforeend", child));
	else
		appendChild(elem, "beforeend", children);

	return elem as HTMLElementTagNameMap[TElement];
}

const applyOptions = (elem: HTMLElement, options?: ElementOptions | CssClass | null) => {
	if (!options)
		return;

	if (typeof options === "string" || Array.isArray(options))
		helpers.addCssClass(elem, <CssClass>options);
	else {
		for (let key in options) {
			const value = options[key];
			if (value === undefined)
				continue;

			switch (key) {
				case "id":
					elem.id = value as string;
					break;
				case "styles": {
					if (value) {
						for (const sKey in value as object)
							(<any>elem.style)[sKey] = (<any>value)[sKey];
					}
					break;
				}
				case "class": {
					helpers.addCssClass(elem, <CssClass>value);
					break;
				}
				case "command": {
					elem.dataset["command"] = value as string;
					break;
				}
				case "dataset": {
					if (value) {
						for (const dataName in value as object)
							elem.dataset[dataName] = (<any>value)[dataName];
					}
					break;
				}
				case "events": {
					if (value) {
						for (const eventName in value as object)
							elem.addEventListener(eventName, (<any>value)[eventName]);
					}
					break;
				}
				default: {
					if (typeof value === "object")
						elem.setAttribute(key, value ? JSON.stringify(value) : "");
					else if (typeof value === "string")
						elem.setAttribute(key, value ? value as string : "");
					else
						elem.setAttribute(key, value ? value.toString() : "");
					break;
				}
			}
		}
	}
}

const appendChild = (container: HTMLElement, where: InsertPosition, children?: TagChildrenLike) => {
	if (!children)
		return;

	if (children instanceof Element)
		container.insertAdjacentElement(where, children);
	else if (children instanceof Promise)
		children.then((child: TagChildrenPrimitive) => appendChild(container, where, child));
	else {
		const typeName = typeof children;
		switch (typeName) {
			case "string":
				container.insertAdjacentHTML(where, <string>children);
				break;
			case "number":
				container.insertAdjacentHTML(where, children.toString());
				break;
			case "function":
				const child = (<(elem: HTMLElement) => TagChildrenPrimitive>children)(container);
				if (child)
					appendChild(container, where, child);
				break;
			default:
				throw new Error(`Not support child type of ${typeName}.`);
		}
	}
};

export {
	tag,
	applyOptions,
	appendChild
}