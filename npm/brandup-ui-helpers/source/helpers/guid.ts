/**
 * Generates a RFC 4122 UUID v4 string using `crypto.randomUUID()`.
 *
 * @returns A newly generated UUID string in `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` form.
 * @example
 * createGuid(); // e.g. "3f2a1b4c-9d8e-4a23-b123-456789abcdef"
 */
const createGuid = (): string => crypto.randomUUID();

/** The empty (all-zero) GUID value `"00000000-0000-0000-0000-000000000000"`. */
const empty = "00000000-0000-0000-0000-000000000000";

export {
	createGuid,
	empty
}