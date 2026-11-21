/** Split a poem body into stanzas of lines (blank line = stanza break). */
export const stanzas = (body: string) =>
	body
		.split(/\n\s*\n/)
		.map((s) => s.split('\n'))
		.filter((s) => s.some((l) => l.trim()));

/** Short preview: first stanza plus the closing couplet, as on the landing page. */
export const excerpt = (body: string, maxLines = 6) => {
	const st = stanzas(body);
	if (st.length <= 1) return st.flat().slice(0, maxLines).join('\n');
	const first = st[0].join('\n');
	const last = st[st.length - 1].slice(-2).join('\n');
	return `${first}\n\n${last}`;
};

export const roman = (n: number) =>
	['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'][n] ?? String(n + 1);
