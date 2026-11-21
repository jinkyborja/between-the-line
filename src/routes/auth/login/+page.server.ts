import { fail, redirect } from '@sveltejs/kit';
import { safeNext } from '#lib/server/redirect.ts';
import { startGoogle } from '#lib/server/auth.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => ({
	next: safeNext(url.searchParams.get('next')),
	authError: url.searchParams.has('error')
});

export const actions: Actions = {
	password: async ({ request, locals, url, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const remember = form.get('remember') === 'on';

		if (!email || !password) return fail(400, { email, message: 'Please enter your email and password.' });

		// Set before sign-in so the hook writes session-only auth cookies when unticked.
		if (remember) cookies.delete('btl_ephemeral', { path: '/' });
		else cookies.set('btl_ephemeral', '1', { path: '/', httpOnly: true, sameSite: 'lax' });

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			const unconfirmed = /confirm/i.test(error.message);
			// Generic otherwise: don't reveal whether an account exists.
			return fail(400, {
				email,
				message: unconfirmed
					? 'Please confirm your email first — the link is in your inbox.'
					: 'That email and password don’t match. Try again?'
			});
		}

		redirect(303, safeNext(url.searchParams.get('next')));
	},
	google: startGoogle
};
