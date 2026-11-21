import type { PageServerLoad } from './$types';

// Private account overview — visible to the owner only (every query is RLS-scoped).
export const load: PageServerLoad = async ({ locals }) => {
	const sb = locals.supabase;
	const user = locals.user!;
	const [profile, entries, bookmarks, mine] = await Promise.all([
		sb.from('profiles').select('display_name, bio, created_at').eq('id', user.id)
			.single<{ display_name: string; bio: string | null; created_at: string }>(),
		sb.from('reflections').select('status, poem:poems(category:categories(name))')
			.returns<{ status: string; poem: { category: { name: string } | null } | null }[]>(),
		sb.from('bookmarks').select('poem_id', { count: 'exact', head: true }),
		sb.from('community_feed').select('id, likes_count, comments_count').eq('is_mine', true)
			.returns<{ id: string; likes_count: number; comments_count: number }[]>()
	]);

	const tally = new Map<string, number>();
	for (const e of entries.data ?? []) {
		const c = e.poem?.category?.name;
		if (c) tally.set(c, (tally.get(c) ?? 0) + 1);
	}

	const posts = mine.data ?? [];
	return {
		profile: profile.data,
		email: user.email ?? '',
		stats: {
			reflections: (entries.data ?? []).filter((e) => e.status === 'saved').length,
			drafts: (entries.data ?? []).filter((e) => e.status === 'draft').length,
			bookmarks: bookmarks.count ?? 0,
			posts: posts.length,
			felt: posts.reduce((n, p) => n + p.likes_count, 0)
		},
		oftenReads: [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n)
	};
};
