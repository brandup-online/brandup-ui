import { formatText } from "../../source/index";

describe("formatText", () => {
	it("No args", () => {
		expect(formatText("Hello {0}")).toBe("Hello {0}");
	});

	it("Pos agrs", () => {
		expect(formatText("Hello {0}", "World")).toBe("Hello World");
		expect(formatText("Hello {1} {0}", "World", "User")).toBe(
			"Hello User World"
		);
	});

	it("{..agrs}", () => {
		expect(formatText("Year is {year}", { year: 2024 })).toBe(
			"Year is 2024"
		);
		expect(
			formatText("Hello {name}, age {age}", { name: "John", age: 30 })
		).toBe("Hello John, age 30");
	});

	it("Returns empty string for missing keys", () => {
		expect(formatText("Hello {missing}", { name: "John" })).toBe("Hello ");
	});

	it("Returns empty string for non-numeric positional key", () => {
		expect(formatText("Hello {abc}", "World")).toBe("Hello ");
	});

	it("Returns empty string for out-of-range positional index", () => {
		expect(formatText("Hello {5}", "World")).toBe("Hello ");
	});
});
