import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$app/env/private';
import { PUBLIC_SUPABASE_URL } from '$app/env/public';

/**
 * Service-role client. Lives in #lib/server so SvelteKit refuses to bundle it
 * for the browser. Used only for deleting the caller's own auth account.
 */
export function serviceClient() {
	if (!SUPABASE_SERVICE_ROLE_KEY) return null;
	return createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}
