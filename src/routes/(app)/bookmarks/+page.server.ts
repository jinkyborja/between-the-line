import { CARD_SELECT, toCard } from '#lib/server/poems.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// RLS returns only the caller's bookmarks.
	const { data, error } = await locals.supabase
		.from('bookmarks')
		.select(`created_at, poem:poems!inner(${CARD_SELECT})`)
		.order('created_at', { ascending: false });

	return {
		items: ((data ?? []) as unknown as { created_at: string; poem: Parameters<typeof toCard>[0] }[]).map((b) => ({
			savedAt: b.created_at,
			poem: toCard(b.poem)
		})),
		error: error ? 'Your bookmarks didn’t load. Please try again.' : null
	};
};
