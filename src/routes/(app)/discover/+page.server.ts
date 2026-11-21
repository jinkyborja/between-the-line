import { CARD_SELECT, toCard, toCards } from '#lib/server/poems.ts';
import type { Category, CommunityPost, Reflection } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

type FeedItem = Pick<CommunityPost, 'id' | 'body' | 'likes_count' | 'created_at' | 'poem_title' | 'poem_slug'>;

export const load: PageServerLoad = async ({ locals }) => {
	const sb = locals.supabase;
	const today = new Date().toISOString().slice(0, 10);
	const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

	const [potd, cats, featured, recent, recs, highlight, draft, saved, entries, letters] = await Promise.all([
		sb.from('poems').select(`${CARD_SELECT}, reflection_prompts`).eq('featured_on', today).maybeSingle(),
		sb.from('categories').select('id, slug, name').order('sort_order').returns<Pick<Category, 'id' | 'slug' | 'name'>[]>(),
		sb.from('poems').select(CARD_SELECT).eq('is_featured', true).order('created_at', { ascending: false }).limit(4),
		sb.from('poems').select(CARD_SELECT).order('created_at', { ascending: false }).limit(5),
		sb.from('community_feed').select('id, body, likes_count, created_at, poem_title, poem_slug')
			.not('poem_id', 'is', null).order('created_at', { ascending: false }).limit(2).returns<FeedItem[]>(),
		sb.from('community_feed').select('id, body, likes_count, created_at, poem_title, poem_slug')
			.gte('created_at', weekAgo).order('likes_count', { ascending: false }).limit(1).maybeSingle<FeedItem>(),
		// Own drafts only (RLS).
		sb.from('reflections').select('id, title, poem_id').eq('status', 'draft')
			.order('updated_at', { ascending: false }).limit(1).maybeSingle<Pick<Reflection, 'id' | 'title' | 'poem_id'>>(),
		// Recently saved poems (own bookmarks, RLS).
		sb.from('bookmarks').select(`created_at, poem:poems!inner(${CARD_SELECT})`)
			.order('created_at', { ascending: false }).limit(3),
		// Your recent private writing — shown only to you (RLS).
		sb.from('reflections').select('id, title, status, updated_at')
			.order('updated_at', { ascending: false }).limit(3)
			.returns<{ id: string; title: string | null; status: string; updated_at: string }[]>(),
		sb.from('letters').select('id, title, kind, status, updated_at').is('archived_at', null)
			.order('updated_at', { ascending: false }).limit(2)
			.returns<{ id: string; title: string | null; kind: string; status: string; updated_at: string }[]>()
	]);

	let poemOfDay = potd.data ? { ...toCard(potd.data as never), prompts: (potd.data as { reflection_prompts: string[] }).reflection_prompts } : null;
	if (!poemOfDay) {
		const { data } = await sb.from('poems').select(`${CARD_SELECT}, reflection_prompts`).eq('kind', 'poem')
			.order('featured_on', { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
		if (data) poemOfDay = { ...toCard(data as never), prompts: (data as { reflection_prompts: string[] }).reflection_prompts };
	}

	return {
		poemOfDay,
		categories: cats.data ?? [],
		featured: toCards(featured.data).filter((p) => p.id !== poemOfDay?.id).slice(0, 3),
		recent: toCards(recent.data),
		recs: recs.data ?? [],
		highlight: highlight.data,
		draft: draft.data,
		saved: ((saved.data ?? []) as unknown as { poem: Parameters<typeof toCard>[0] }[]).map((b) => toCard(b.poem)),
		activity: [
			...(entries.data ?? []).map((e) => ({ kind: 'journal' as const, id: e.id, title: e.title || 'Untitled entry', draft: e.status === 'draft', at: e.updated_at, href: `/write?id=${e.id}` })),
			...(letters.data ?? []).map((l) => ({ kind: 'letter' as const, id: l.id, title: l.title || 'Untitled letter', draft: l.status === 'draft', at: l.updated_at, href: `/letters/write?id=${l.id}` }))
		].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4)
	};
};
