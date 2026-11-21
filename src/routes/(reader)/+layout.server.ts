import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Full-width reading layout (no sidebar). Signed-in only, like the rest of the app.
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, `/auth/login?next=${encodeURIComponent(url.pathname)}`);
	const { data } = await locals.supabase
		.from('profiles')
		.select('text_size')
		.eq('id', locals.user.id)
		.maybeSingle<{ text_size: 'S' | 'M' | 'L' }>();
	return { textSize: data?.text_size ?? 'M' };
};
