/** Options used to configure an element created by {@link tag}. Recognized keys (`id`, `class`, `command`, `dataset`, `events`, `styles`) are handled specially; any other key is applied as a plain attribute. */
export interface ElementOptions {
	/** Value for the element's `id` attribute. */
	id?: string,
	/** CSS class(es) to add to the element. */
	class?: CssClass;
	/** Sets the `data-command` attribute (shortcut for `dataset.command`). */
	command?: string;
	/** Custom `data-*` attributes to set on the element. */
	dataset?: ElementData;
	/** Event listeners to attach, keyed by lower-case event name. */
	events?: ElementEvents;
	/** Inline styles to apply to `element.style`. */
	styles?: ElementStyles;
	/** Any other key is set as a plain attribute. `null` sets an empty attribute, objects are JSON-stringified, other values are coerced to string. `undefined` is ignored. */
	[name: string]: string | number | boolean | object | null | undefined; // attributes
}

/** One or more CSS class names: a space-separated string or an array of class names. */
export type CssClass = string | string[];

/** Map of custom `data-*` attribute names to their string values. */
export interface ElementData {
	[name: string]: string | undefined;
}

/** Map of DOM event handlers keyed by lower-case event name (e.g. `click`, `mouseover`), strongly typed to the matching `HTMLElementEventMap` event. */
export type ElementEvents = {
	[Name in keyof HTMLElementEventMap as `${Lowercase<string & Name>}`]?: (e: HTMLElementEventMap[Name]) => void;
};

/** Inline style declaration: a partial set of writable `CSSStyleDeclaration` properties. */
export type ElementStyles = Partial<CSSStyleDeclaration>;

/** A value accepted as a {@link tag} child: a primitive, a promise of one, a factory function receiving the container element, or a (possibly nested) array of any of these. */
export type TagChildrenLike = TagChildrenPrimitive | Promise<TagChildrenPrimitive> | ((elem: HTMLElement) => Promise<TagChildrenPrimitive> | Promise<TagChildrenPrimitive[]> | TagChildrenPrimitive | TagChildrenPrimitive[] | void) | Array<TagChildrenLike>;
/** A single concrete child value: an existing `Element`, a string/number rendered as HTML, or `null`/`undefined` (ignored). */
export type TagChildrenPrimitive = Element | string | number | null | undefined;
