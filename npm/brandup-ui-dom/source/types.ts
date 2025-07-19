export interface ElementOptions {
	id?: string,
	class?: CssClass;
	command?: string;
	dataset?: ElementData;
	events?: ElementEvents;
	styles?: ElementStyles;
	[name: string]: string | number | boolean | object | null | undefined; // attributes
}

export type CssClass = string | string[];

export interface ElementData {
	[name: string]: string | undefined;
}

export type ElementEvents = {
	[Name in keyof HTMLElementEventMap as `${Lowercase<string & Name>}`]?: (e: HTMLElementEventMap[Name]) => void;
};

export type ElementStyles = Partial<CSSStyleDeclaration>;

export type TagChildrenLike = TagChildrenPrimitive | Promise<TagChildrenPrimitive> | ((elem: HTMLElement) => Promise<TagChildrenPrimitive> | Promise<TagChildrenPrimitive[]> | TagChildrenPrimitive | TagChildrenPrimitive[] | void) | Array<TagChildrenLike>;
export type TagChildrenPrimitive = Element | string | number | null | undefined;