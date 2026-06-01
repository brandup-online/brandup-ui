export * from "./types"
export * from "./bind"
export * from "./bind-each"
import * as DomHelpers from "./dom"
import * as TagHelpers from "./tag"

/** Collection of DOM helper functions: element queries/traversal ({@link getById}, {@link queryElement}, {@link nextElement}, ...), class manipulation ({@link addClass}, {@link removeClass}), {@link empty}, and element creation via {@link tag}. */
export const DOM = {
	...DomHelpers,
	...TagHelpers
}