import { fail, redirect } from '@sveltejs/kit';
import { MIN_PASSWORD } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

// Reached from the recovery email via /auth/callback, which signs the user in.
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/forgot');
	return { email: locals.user.email ?? '' };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/auth/forgot');
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		if (password.length < MIN_PASSWORD)
			return fail(400, { message: `Please use at least ${MIN_PASSWORD} characters.` });
		if (password !== confirm) return fail(400, { message: 'Those two passwords don’t match.' });

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) return fail(400, { message: error.message });

		redirect(303, '/discover');
	}
};
