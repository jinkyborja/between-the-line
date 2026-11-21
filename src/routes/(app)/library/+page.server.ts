import { CARD_SELECT, bookmarkedIds, toCards } from '#lib/server/poems.ts';
import type { Category } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

const SORTS ={ newest: 'Newest', oldest: 'Oldest', title: 'Title A–Z' } as const;
type Sort = keyof typeof SORTS;

export const load: PageServerLoad = async ({ locals, url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
	const category = url.searchParams.get('category') ?? '';
	const kind = url.searchParams.get('kind') ?? '';
	const sort: Sort = (url.searchParams.get('sort') as Sort) in SORTS ? (url.searchParams.get('sort') as Sort) : 'newest';
	const sb = locals.supabase;

	let query = sb.from('poems').select(CARD_SELECT).limit(60);
	if (q) query = query.textSearch('search', q, { type: 'websearch', config: 'english' });
	if (category) query = query.eq('category.slug', category);
	if (kind === 'poem' || kind === 'quote') query = query.eq('kind', kind);
	query =
		sort === 'title'
			? query.order('title')
			: query.order('created_at', { ascending: sort === 'oldest' });

	const [poemsRes, catsRes, featuredRes, feedRes] = await Promise.all([
		query,
		sb.from('categories').select('id, slug, name, description, sort_order').order('sort_order').returns<Category[]>(),
		sb.from('poems').select(CARD_SELECT).eq('is_featured', true).order('created_at', { ascending: false }).limit(4),
		// Anonymous view: only poem ids are read here, used for "N reflections".
		sb.from('community_feed').select('poem_id').not('poem_id', 'is', null).limit(2000)
	]);

	const poems = toCards(poemsRes.data);
	const counts: Record<string, number> = {};
	for (const r of feedRes.data ?? []) counts[r.poem_id as string] = (counts[r.poem_id as string] ?? 0) + 1;

	return {
		poems,
		featured: toCards(featuredRes.data),
		categories: catsRes.data ?? [],
		saved: await bookmarkedIds(sb, poems.map((p) => p.id)),
		counts,
		filters: { q, category, kind, sort },
		sorts: SORTS,
		error: poemsRes.error ? 'The library didn’t load. Please try again.' : null
	};
};
