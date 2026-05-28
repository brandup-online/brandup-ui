import { createQuery, addQuery } from "../source/helpers";

it('createQuery from FormData', () => {
	const form = new FormData();
	form.append("a", "1");
	form.append("b", "2");
	form.append("b", "3");

	const params = createQuery(form);

	expect(params.getAll("a")).toEqual(["1"]);
	expect(params.getAll("b")).toEqual(["2", "3"]);
});

it('createQuery from FormData does not mutate source', () => {
	const form = new FormData();
	form.append("a", "1");

	createQuery(form);

	expect(form.getAll("a")).toEqual(["1"]);
});

it('createQuery from object with arrays', () => {
	const params = createQuery({ a: "1", b: ["2", "3"] });

	expect(params.getAll("a")).toEqual(["1"]);
	expect(params.getAll("b")).toEqual(["2", "3"]);
});

it('addQuery appends FormData params', () => {
	const form = new FormData();
	form.append("x", "1");

	expect(addQuery("/path", form)).toEqual("/path?x=1");
	expect(addQuery("/path?y=0", form)).toEqual("/path?y=0&x=1");
});
