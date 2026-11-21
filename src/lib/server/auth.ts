import { fail, type RequestEvent } from '@sveltejs/kit';
import { safeNext } from './redirect.ts';

export const MIN_PASSWORD = 10;

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

/** Where the verification link lands. `flow=verify` tells the callback to route to Login. */
export const verifyRedirect = (origin: string, next: string) =>
	`${origin}/auth/callback?flow=verify&next=${encodeURIComponent(next)}`;

/**
 * Resend the sign-up verification email (sent by Supabase through the configured SMTP, i.e. Brevo).
 * Always answers the same way so it never reveals whether an account exists.
 */
export async function resendVerification(event: RequestEvent) {
	const form = await event.request.formData();
	const email = String(form.get('email') ?? '').trim();
	const next = safeNext(event.url.searchParams.get('next'));
	if (!isEmail(email)) return fail(400, { email, sent: true, resendError: 'Please enter a valid email address.' });

	const { error } = await event.locals.supabase.auth.resend({
		type: 'signup',
		email,
		options: { emailRedirectTo: verifyRedirect(event.url.origin, next) }
	});
	if (error) {
		console.error('[resend] Supabase error:', error.status, error.code, error.message);
		if (error.code === 'over_email_send_rate_limit' || error.status === 429)
			return fail(429, { email, sent: true, resendError: 'Please wait a minute before asking for another email.' });
	}
	return { email, sent: true, resent: true };
}
