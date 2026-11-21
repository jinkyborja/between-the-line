import { fail, redirect } from '@sveltejs/kit';
import { safeNext } from '#lib/server/redirect.ts';
import { MIN_PASSWORD, isEmail, startGoogle } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => ({
	next: safeNext(url.searchParams.get('next'))
});

export const actions: Actions = {
	password: async ({ request, locals, url, cookies }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim().slice(0, 60);
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const next = safeNext(url.searchParams.get('next'));

		if (!name) return fail(400, { name, email, message: 'What should we call you? A first name or a pen name is fine.' });
		if (!isEmail(email)) return fail(400, { name, email, message: 'That email doesn’t look quite right.' });
		if (password.length < MIN_PASSWORD)
			return fail(400, { name, email, message: `Please use at least ${MIN_PASSWORD} characters for your password.` });

		cookies.delete('btl_ephemeral', { path: '/' });

		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { display_name: name },
				emailRedirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`
			}
		});

		if (error) {
			if (/password/i.test(error.message)) return fail(400, { name, email, message: error.message });
			return fail(400, { name, email, message: 'We couldn’t create your account just now. Please try again.' });
		}

		// Email confirmation off → signed in immediately.
		if (data.session) redirect(303, next);

		// Same response whether or not the address was already registered.
		return { sent: true, email };
	},
	google: startGoogle
};
