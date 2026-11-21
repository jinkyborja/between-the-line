import { error } from '@sveltejs/kit';
import type { Poem, Reflection } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

type PoemCtx = Pick<Poem, 'id' | 'slug' | 'title' | 'author' | 'body' | 'kind' | 'reflection_prompts'>;
const POEM_COLS = 'id, slug, title, author, body, kind, reflection_prompts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;
	const id = url.searchParams.get('id');
	let entry: Reflection | null = null;
	let poem: PoemCtx | null = null;

	if (id) {
		// RLS: only the owner's entry can come back.
		const { data } = await sb
			.from('reflections')
			.select('id, poem_id, title, body, moods, tags, status, created_at, updated_at')
			.eq('id', id)
			.maybeSingle<Reflection>();
		if (!data) error(404, 'We couldn’t find that entry.');
		entry = data;
		if (data.poem_id) {
			poem = (await sb.from('poems').select(POEM_COLS).eq('id', data.poem_id).maybeSingle<PoemCtx>()).data;
		}
	} else {
		const slug = url.searchParams.get('poem');
		if (slug) poem = (await sb.from('poems').select(POEM_COLS).eq('slug', slug).maybeSingle<PoemCtx>()).data;
	}

	return { entry, poem };
};
