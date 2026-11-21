import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// POST only, so a link or image can't sign someone out (SvelteKit also checks Origin on POST).
export const POST: RequestHandler = async ({ locals }) => {
	await locals.supabase.auth.signOut();
	redirect(303, '/');
};
