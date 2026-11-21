import { fail, redirect } from '@sveltejs/kit';
import { friendlyError } from '#lib/community.ts';
import type { Category } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const slug = url.searchParams.get('poem');
	const [cats, poem] = await Promise.all([
		locals.supabase.from('categories').select('id, slug, name').order('sort_order').returns<Pick<Category, 'id' | 'slug' | 'name'>[]>(),
		slug
			? locals.supabase.from('poems').select('id, slug, title, author, category:categories(slug)').eq('slug', slug)
				.maybeSingle<{ id: string; slug: string; title: string; author: string; category: { slug: string } | null }>()
			: Promise.resolve({ data: null })
	]);
	return { categories: cats.data ?? [], poem: poem.data };
};

export const actions: Actions = {
	// A brand-new anonymous post. It never reads from, or links to, the journal.
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const body = String(form.get('body') ?? '').trim();
		const category = String(form.get('category') ?? '');
		const poemId = String(form.get('poem_id') ?? '') || null;

		if (!body) return fail(400, { body, category, message: 'Write a few words first.' });
		if (body.length > 4000) return fail(400, { body, category, message: 'Please keep it under 4,000 characters.' });
		if (!category) return fail(400, { body, category, message: 'Choose the feeling it belongs to.' });
		if (form.get('ack') !== 'on')
			return fail(400, { body, category, message: 'Please confirm it doesn’t identify you or anyone else.' });

		// author_id is stamped inside the database function from the verified session.
		const { error } = await locals.supabase.rpc('create_community_post', {
			p_body: body,
			p_category_slug: category,
			p_poem_id: poemId
		});
		if (error) return fail(400, { body, category, message: friendlyError(error.message) });

		redirect(303, '/community?posted=1');
	}
};
