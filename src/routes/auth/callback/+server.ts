import { redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext } from '#lib/server/redirect.ts';
import type { RequestHandler } from './$types';

/**
 * Landing point for Google OAuth, email confirmation and password recovery.
 * Supports both the PKCE `code` flow and the `token_hash` email template flow.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const next = safeNext(url.searchParams.get('next'));
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) redirect(303, next);
	} else if (tokenHash && type) {
		const { error } = await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type });
		if (!error) redirect(303, type === 'recovery' ? '/auth/reset' : next);
	}

	redirect(303, '/auth/login?error=link');
};
