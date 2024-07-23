export * from "./types"
import * as DomHelpers from "./dom"
import * as TagHelpers from "./tag"

export const DOM = {
	...DomHelpers,
	...TagHelpers
}