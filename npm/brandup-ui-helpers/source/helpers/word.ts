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