/**
 * Returns a word combined with the grammatical ending that agrees with the given count.
 *
 * Implements Russian-style pluralization rules: the ending is chosen depending on
 * whether the count ends in 1, in 2–4, or in 0/5–9 (with 11–14 treated as the "five" form).
 *
 * @param count Quantity that the word refers to.
 * @param word Word stem to which the ending is appended.
 * @param one Ending used for counts ending in 1 (but not 11).
 * @param two Ending used for counts ending in 2–4 (but not 12–14).
 * @param five Ending used for counts ending in 0, 5–9 and 11–20.
 * @returns The word with the appropriate ending appended.
 * @example
 * getWordEnd(1, "товар", "", "а", "ов"); // "товар"
 * getWordEnd(3, "товар", "", "а", "ов"); // "товара"
 * getWordEnd(5, "товар", "", "а", "ов"); // "товаров"
 */
function getWordEnd(count: number, word: string, one?: string, two?: string, five?: string): string {
	const tt = count % 100;
	if (tt >= 5 && tt <= 20)
		return word + (five || "");

	const t = count % 10;

	return (t === 1 ?
		(word + (one || "")) : ((t >= 2 && t <= 4) ? (word + (two || "")) : (word + (five || "")))
	);
}

export {
	getWordEnd
};