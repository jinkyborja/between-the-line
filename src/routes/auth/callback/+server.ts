import { redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import { safeNext } from '#lib/server/redirect.ts';
import type { RequestHandler } from './$types';

/**
 * Landing point for emailed links (sign-up verification and password recovery).
 * Supports both the PKCE `code` flow and the `token_hash` email template flow.
 * The `code` branch is provider-agnostic, so an OAuth provider can reuse it later.
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	const next = safeNext(url.searchParams.get('next'));
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	// Set by the sign-up action on the emailRedirectTo URL.
	const isVerify = url.searchParams.get('flow') === 'verify' || type === 'signup' || type === 'email';

	let ok = false;
	if (code) ok = !(await locals.supabase.auth.exchangeCodeForSession(code)).error;
	else if (tokenHash && type) ok = !(await locals.supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;

	if (!ok) redirect(303, isVerify ? '/auth/login?error=verify' : '/auth/login?error=link');

	if (type === 'recovery') redirect(303, '/auth/reset');

	if (isVerify) {
		// Email is now verified. Send them to sign in deliberately rather than auto-entering.
		await locals.supabase.auth.signOut({ scope: 'local' });
		const q = next !== '/discover' ? `&next=${encodeURIComponent(next)}` : '';
		redirect(303, `/auth/login?verified=1${q}`);
	}

	redirect(303, next);
};
