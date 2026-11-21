import { error } from '@sveltejs/kit';
import { kindOf, salutationFor } from '#lib/letters.ts';
import type { RequestHandler } from './$types';

type Row = {
	title: string | null;
	body: string;
	moods: string[];
	tags: string[];
	status: string;
	created_at: string;
	poem: { title: string; author: string } | null;
};

// Your journal as a single Markdown file. RLS returns only your own entries.
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) error(401);
	const { data, error: err } = await locals.supabase
		.from('reflections')
		.select('title, body, moods, tags, status, created_at, poem:poems(title, author)')
		.order('created_at')
		.returns<Row[]>();
	if (err) error(500, 'Export failed');

	const lines = [`# My Journal — Between the Lines`, '', `Exported ${new Date().toUTCString()}`, ''];
	for (const r of data ?? []) {
		lines.push('---', '', `## ${r.title || 'Untitled'}${r.status === 'draft' ? ' (draft)' : ''}`, '');
		lines.push(`*${new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}*`);
		if (r.poem) lines.push(`*On “${r.poem.title}” — ${r.poem.author}*`);
		if (r.moods.length) lines.push(`Feeling: ${r.moods.join(', ')}`);
		if (r.tags.length) lines.push(`Tags: ${r.tags.map((t) => '#' + t).join(' ')}`);
		lines.push('', r.body, '');
	}

	// Letters to Myself (also owner-only by RLS).
	const { data: letters } = await locals.supabase
		.from('letters')
		.select('kind, recipient, title, body, status, archived_at, remind_on, created_at')
		.order('created_at');
	if (letters?.length) {
		lines.push('', '# Letters to Myself', '');
		for (const l of letters) {
			lines.push('---', '', `## ${l.title || 'Untitled letter'} — ${kindOf(l.kind).label}${l.status === 'draft' ? ' (draft)' : ''}${l.archived_at ? ' (archived)' : ''}`, '');
			lines.push(`*${new Date(l.created_at).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}*`);
			if (l.remind_on) lines.push(`To be opened: ${l.remind_on}`);
			lines.push('', salutationFor(l.kind, l.recipient), '', l.body, '', '— me', '');
		}
	}

	return new Response(lines.join('\n'), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'content-disposition': `attachment; filename="between-the-lines-journal-${new Date().toISOString().slice(0, 10)}.md"`,
			'cache-control': 'private, no-store'
		}
	});
};
