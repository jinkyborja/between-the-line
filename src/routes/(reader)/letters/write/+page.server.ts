import { error } from '@sveltejs/kit';
import type { Letter, LetterKind } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const KINDS: LetterKind[] = ['past', 'present', 'future', 'unsent'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const id = url.searchParams.get('id');
	if (id) {
		// RLS: only the owner's letter can come back.
		const { data } = await locals.supabase
			.from('letters')
			.select('id, kind, recipient, title, body, status, archived_at, remind_on, reminded_at, created_at, updated_at')
			.eq('id', id)
			.maybeSingle<Letter>();
		if (!data) error(404, 'We couldn’t find that letter.');
		return { letter: data, kind: data.kind };
	}
	const k = url.searchParams.get('kind') as LetterKind;
	return { letter: null, kind: KINDS.includes(k) ? k : ('present' as LetterKind) };
};
