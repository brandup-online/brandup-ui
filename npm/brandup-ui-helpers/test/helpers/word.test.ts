import { WordHelper } from "../../source/index";

const files = (n: number) => WordHelper.getWordEnd(n, "файл", "", "а", "ов");

it("getWordEnd handles singular form", () => {
	expect(files(1)).toEqual("файл");
	expect(files(21)).toEqual("файл");
	expect(files(101)).toEqual("файл");
});

it("getWordEnd handles few form (2-4)", () => {
	expect(files(2)).toEqual("файла");
	expect(files(4)).toEqual("файла");
	expect(files(22)).toEqual("файла");
});

it("getWordEnd handles many form (5-20, 0)", () => {
	expect(files(5)).toEqual("файлов");
	expect(files(11)).toEqual("файлов");
	expect(files(20)).toEqual("файлов");
	expect(files(25)).toEqual("файлов");
	expect(files(111)).toEqual("файлов");
});

it("getWordEnd returns base word when no endings provided (two form)", () => {
	expect(WordHelper.getWordEnd(2, "x")).toEqual("x");
});

it("getWordEnd returns base word when no endings provided (one form)", () => {
	expect(WordHelper.getWordEnd(1, "x")).toEqual("x");
});

it("getWordEnd returns base word when no endings provided (five form, tt range)", () => {
	expect(WordHelper.getWordEnd(11, "x")).toEqual("x");
});

it("getWordEnd returns base word when no endings provided (five form, else)", () => {
	expect(WordHelper.getWordEnd(25, "x")).toEqual("x");
});
