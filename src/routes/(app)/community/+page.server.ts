import type { Category, CommunityPost } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const PAGE = 20;

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;
	const sort = ['recent', 'felt', 'mine'].includes(url.searchParams.get('sort') ?? '') ? url.searchParams.get('sort')! : 'recent';
	const category = url.searchParams.get('category') ?? '';
	const limit = Math.min(PAGE * Math.max(1, Number(url.searchParams.get('more') ?? 1) | 0), 200);

	// The view has no author columns; is_mine only ever tells you about yourself.
	let q = sb.from('community_feed').select('*').limit(limit + 1);
	if (category) q = q.eq('category_slug', category);
	if (sort === 'mine') q = q.eq('is_mine', true);
	q = sort === 'felt'
		? q.order('likes_count', { ascending: false }).order('created_at', { ascending: false })
		: q.order('created_at', { ascending: false });

	const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
	const [posts, cats, reading] = await Promise.all([
		q.returns<CommunityPost[]>(),
		sb.from('categories').select('id, slug, name').order('sort_order').returns<Pick<Category, 'id' | 'slug' | 'name'>[]>(),
		sb.from('community_feed').select('poem_slug, poem_title').not('poem_id', 'is', null).gte('created_at', weekAgo).limit(500)
	]);

	// "This week, many are reading": the poem most reflected on in the last 7 days.
	const tally = new Map<string, { slug: string; title: string; n: number }>();
	for (const r of reading.data ?? []) {
		const t = tally.get(r.poem_slug) ?? { slug: r.poem_slug, title: r.poem_title, n: 0 };
		t.n++;
		tally.set(r.poem_slug, t);
	}
	const trending = [...tally.values()].sort((a, b) => b.n - a.n)[0] ?? null;

	const rows = posts.data ?? [];
	return {
		posts: rows.slice(0, limit),
		hasMore: rows.length > limit,
		categories: cats.data ?? [],
		filters: { sort, category, more: limit / PAGE },
		trending,
		posted: url.searchParams.has('posted'),
		error: posts.error ? 'The community didn’t load. Please try again.' : null
	};
};
