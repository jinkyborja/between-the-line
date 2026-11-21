import type { Notification } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends }) => {
	depends('app:notifications');
	// RLS: recipient only. Rows never contain who acted.
	const { data } = await locals.supabase
		.from('notifications')
		.select('id, type, post_id, comment_id, read_at, created_at')
		.order('created_at', { ascending: false })
		.limit(100)
		.returns<Notification[]>();

	const items = data ?? [];
	const unread = items.filter((n) => !n.read_at).map((n) => n.id);
	if (unread.length) {
		await locals.supabase.from('notifications').update({ read_at: new Date().toISOString() }).in('id', unread);
	}
	return { items, unreadIds: unread };
};
