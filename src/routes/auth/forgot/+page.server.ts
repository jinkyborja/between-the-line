import { fail } from '@sveltejs/kit';
import { isEmail } from '#lib/server/auth.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const email = String((await request.formData()).get('email') ?? '').trim();
		if (!isEmail(email)) return fail(400, { email, message: 'That email doesn’t look quite right.' });

		// The link returns to /auth/callback, which exchanges the code and opens /auth/reset.
		await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/auth/callback?next=/auth/reset`
		});

		// Always the same answer, so the form can't be used to discover accounts.
		return { sent: true, email };
	}
};
