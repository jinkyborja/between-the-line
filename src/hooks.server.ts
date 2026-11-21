import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';

/** Routes reachable without an account. Everything else requires sign-in. */
const PUBLIC_PATHS = ['/', '/auth'];
const isPublic = (path: string) =>
	PUBLIC_PATHS.some((p) => (p === '/' ? path === '/' : path === p || path.startsWith(p + '/')));

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				// "Keep me signed in" unticked → session cookies that end with the browser.
				const ephemeral = event.cookies.get('btl_ephemeral') === '1';
				cookiesToSet.forEach(({ name, value, options }) => {
					const opts = { ...options, path: '/' };
					if (ephemeral && value) {
						delete opts.maxAge;
						delete opts.expires;
					}
					event.cookies.set(name, value, opts);
				});
			}
		}
	});

	/**
	 * getSession() alone reads an unverified cookie. getUser() asks Supabase Auth
	 * to validate the JWT, so the user returned here can be trusted on the server.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	let { session, user } = await event.locals.safeGetSession();
	const path = event.url.pathname;

	// Unverified email → no access. Clear the session and send them to sign in.
	// (Accounts from OAuth providers arrive with email_confirmed_at already set.)
	if (user && !user.email_confirmed_at) {
		await event.locals.supabase.auth.signOut({ scope: 'local' });
		session = null;
		user = null;
		if (!isPublic(path)) redirect(303, '/auth/login?unverified=1');
	}

	event.locals.session = session;
	event.locals.user = user;

	if (!user && !isPublic(path)) {
		redirect(303, `/auth/login?next=${encodeURIComponent(path + event.url.search)}`);
	}
	// Signed-in people skip the landing and the login/sign-up screens.
	if (user && (path === '/' || path === '/auth/login' || path === '/auth/signup')) {
		redirect(303, '/discover');
	}

	// Theme preference is mirrored to a cookie so the first paint uses it (no flash).
	const theme = event.cookies.get('btl_theme');
	const safeTheme = theme === 'dark' || theme === 'system' ? theme : 'light';
	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%btl.theme%', safeTheme)
	});

	// Baseline security headers.
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	// Private pages must never be stored by shared caches.
	if (user) response.headers.set('Cache-Control', 'private, no-store');

	return response;
};

export const handle = sequence(supabase, authGuard);
