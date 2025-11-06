import { Guid } from "../../source/index";

const EMPTY = "00000000-0000-0000-0000-000000000000";

it('Guid.empty', async () => {
	expect(EMPTY).toEqual(Guid.empty);
});

it('Guid.createGuid', async () => {
	expect(EMPTY).not.toEqual(Guid.createGuid());

	const g = Guid.createGuid();
	expect(EMPTY.length).toEqual(g.length);
});