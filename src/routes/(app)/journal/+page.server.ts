import type { Reflection } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

export type JournalEntry = Reflection & {
	poem: { title: string; slug: string; category: { name: string; slug: string } | null } | null;
};

export const load: PageServerLoad = async ({ locals }) => {
	// RLS: owner only. No one else — including admins — can read these rows.
	const { data, error } = await locals.supabase
		.from('reflections')
		.select('id, poem_id, title, body, moods, tags, status, created_at, updated_at, poem:poems(title, slug, category:categories(name, slug))')
		.order('created_at', { ascending: false })
		.limit(1000)
		.returns<JournalEntry[]>();

	return {
		entries: data ?? [],
		error: error ? 'Your journal didn’t load. Your entries are safe — please try again.' : null
	};
};
