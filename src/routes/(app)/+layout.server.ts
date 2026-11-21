import { redirect } from '@sveltejs/kit';
import type { Profile } from '#lib/types.ts';
import type { LayoutServerLoad } from './$types';

// Second line of defence after hooks.server.ts: every (app) route needs a verified user.
export const load: LayoutServerLoad = async ({ locals, url, cookies }) => {
	if (!locals.user) redirect(303, `/auth/login?next=${encodeURIComponent(url.pathname)}`);

	// RLS returns only the caller's own row.
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('id, display_name, role, theme, text_size')
		.eq('id', locals.user.id)
		.maybeSingle<Pick<Profile, 'id' | 'display_name' | 'role' | 'theme' | 'text_size'>>();

	const { count: unread } = await locals.supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.is('read_at', null);

	// Carry the saved theme to new devices (applies from the next page load).
	if (profile?.theme && cookies.get('btl_theme') !== profile.theme) {
		cookies.set('btl_theme', profile.theme, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
	}

	return {
		displayName: profile?.display_name ?? 'Reader',
		isAdmin: profile?.role === 'admin',
		textSize: profile?.text_size ?? 'M',
		unreadNotifications: unread ?? 0
	};
};
