import { error } from '@sveltejs/kit';
import type { CommunityPost, Poem } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

type FullPoem = Poem & { category: { name: string; slug: string } };

export const load: PageServerLoad = async ({ locals, params }) => {
	const sb = locals.supabase;
	const { data: poem } = await sb
		.from('poems')
		.select('*, category:categories!inner(name, slug)')
		.eq('slug', params.slug)
		.maybeSingle<FullPoem>();

	if (!poem) error(404, 'We couldn’t find that poem.');

	const [bm, posts, prev, next] = await Promise.all([
		sb.from('bookmarks').select('poem_id').eq('poem_id', poem.id).maybeSingle(),
		// Anonymous community reflections on this poem (view exposes no author data).
		sb
			.from('community_feed')
			.select('id, body, likes_count, created_at', { count: 'exact' })
			.eq('poem_id', poem.id)
			.order('likes_count', { ascending: false })
			.limit(4)
			.returns<Pick<CommunityPost, 'id' | 'body' | 'likes_count' | 'created_at'>[]>(),
		sb
			.from('poems')
			.select('slug, title')
			.eq('category_id', poem.category_id)
			.lt('title', poem.title)
			.order('title', { ascending: false })
			.limit(1)
			.maybeSingle<{ slug: string; title: string }>(),
		sb
			.from('poems')
			.select('slug, title')
			.eq('category_id', poem.category_id)
			.gt('title', poem.title)
			.order('title')
			.limit(1)
			.maybeSingle<{ slug: string; title: string }>()
	]);

	return {
		poem,
		saved: !!bm.data,
		reflections: posts.data ?? [],
		reflectionCount: posts.count ?? 0,
		prev: prev.data,
		next: next.data
	};
};
