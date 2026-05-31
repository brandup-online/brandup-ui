/**
 * Generates a new random GUID string in upper-case `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` form.
 *
 * Uses `Math.random` and is intended for client-side identifiers, not cryptographic use.
 *
 * @returns A newly generated GUID string.
 * @example
 * createGuid(); // e.g. "3F2A1B4C-9D8E-..."
 */
const createGuid = () => {
	const chars: string[] = [];
	for (let j = 0; j < 32; j++) {
		if (j === 8 || j === 12 || j === 16 || j === 20)
			chars.push('-');
		chars.push(Math.floor(Math.random() * 16).toString(16).toUpperCase());
	}
	return chars.join('');
}

/** The empty (all-zero) GUID value `"00000000-0000-0000-0000-000000000000"`. */
const empty = "00000000-0000-0000-0000-000000000000";

export {
	createGuid,
	empty
}