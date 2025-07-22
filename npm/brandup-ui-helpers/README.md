# brandup-ui-helpers

[![Build Status](https://dev.azure.com/brandup/BrandUp%20Core/_apis/build/status%2FBrandUp%2Fbrandup-ui?branchName=master)]()

## Installation

Install NPM package [@brandup/ui-helpers](https://www.npmjs.com/package/@brandup/ui-helpers).

```
npm i @brandup/ui-helpers@latest
```

## String helpers

### Format text

Format with model values:

```TypeScript
const text = "Hello, {name}";
const result = text.format({ name: "Dmitry" }); // Hello, Dmitry
```

Format with arguments:

```TypeScript
const text = "Hello, {0}";
const result = text.format("Dmitry"); // Hello, Dmitry
```

## Object helpers

### Get value by property path

```TypeScript
const model = {
	header: {
		value: "Item"
	}
}

const value = Object.prop(model, "header.value"); // return "Item"

const hasValue = Object.hasProp(model, "header.value"); // return true
```