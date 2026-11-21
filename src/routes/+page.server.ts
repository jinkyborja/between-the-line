import type { Category, Poem } from '#lib/types.ts';
import type { PageServerLoad } from './$types';

type PoemOfDay = Pick<Poem, 'slug' | 'title' | 'author' | 'body'> & { category: { name: string } | null };

// Public page: poems and categories are readable by signed-out visitors (RLS allows it).
export const load: PageServerLoad = async ({ locals }) => {
	const today = new Date().toISOString().slice(0, 10);

	const [todayRes, cats] = await Promise.all([
		locals.supabase
			.from('poems')
			.select('slug, title, author, body, category:categories(name)')
			.eq('featured_on', today)
			.maybeSingle<PoemOfDay>(),
		locals.supabase
			.from('categories')
			.select('id, slug, name, description, sort_order')
			.order('sort_order')
			.returns<Category[]>()
	]);

	let poem = todayRes.data;
	if (!poem) {
		const { data } = await locals.supabase
			.from('poems')
			.select('slug, title, author, body, category:categories(name)')
			.eq('kind', 'poem')
			.order('featured_on', { ascending: false, nullsFirst: false })
			.limit(1)
			.maybeSingle<PoemOfDay>();
		poem = data;
	}

	return { poem, categories: cats.data ?? [] };
};
