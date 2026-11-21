import type { Letter } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Owner-only by RLS. Letters are never readable by anyone else, including admins.
	const { data, error } = await locals.supabase
		.from('letters')
		.select('id, kind, recipient, title, body, status, archived_at, remind_on, reminded_at, created_at, updated_at')
		.order('updated_at', { ascending: false })
		.limit(1000)
		.returns<Letter[]>();

	return {
		letters: data ?? [],
		error: error ? 'Your letters didn’t load. They’re safe — please try again.' : null
	};
};
