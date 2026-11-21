import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import { safeNext } from './redirect.ts';

export const MIN_PASSWORD = 10;

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;

/** Start Google OAuth (PKCE). The verifier cookie is set by the server client. */
export async function startGoogle(event: RequestEvent) {
	const next = safeNext(event.url.searchParams.get('next'));
	const { data, error } = await event.locals.supabase.auth.signInWithOAuth({
		provider: 'google',
		options: { redirectTo: `${event.url.origin}/auth/callback?next=${encodeURIComponent(next)}` }
	});
	if (error || !data.url) {
		return fail(400, { message: 'Google sign-in isn’t available right now. Please use email instead.' });
	}
	redirect(303, data.url);
}
