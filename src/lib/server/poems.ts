import type { SupabaseClient } from '@supabase/supabase-js';
import type { CardPoem } from '#lib/types.ts';

export const CARD_SELECT = 'id, slug, kind, title, author, body, created_at, category:categories!inner(name, slug)';

type Raw = Omit<CardPoem, 'category' | 'category_slug'> & { category: { name: string; slug: string } };

export const toCard = (r: Raw): CardPoem => ({
	id: r.id,
	slug: r.slug,
	kind: r.kind,
	title: r.title,
	author: r.author,
	body: r.body,
	created_at: r.created_at,
	category: r.category?.name ?? '',
	category_slug: r.category?.slug ?? ''
});

export const toCards = (rows: unknown) => ((rows as Raw[] | null) ?? []).map(toCard);

/** Set of poem ids the current user has bookmarked (RLS limits to own rows). */
export async function bookmarkedIds(supabase: SupabaseClient, poemIds?: string[]) {
	let q = supabase.from('bookmarks').select('poem_id');
	if (poemIds) {
		if (!poemIds.length) return [];
		q = q.in('poem_id', poemIds);
	}
	const { data } = await q;
	return (data ?? []).map((b) => b.poem_id as string);
}
