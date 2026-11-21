import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export type QueueItem = {
	report_id: string;
	reason: string;
	details: string | null;
	reported_at: string;
	report_status: string;
	target_type: 'post' | 'comment';
	target_id: string;
	target_body: string;
	target_status: string;
	target_created_at: string;
	reports_on_target: number;
	author_ref: string;
	author_prior_removals: number;
	author_banned: boolean;
};

// The UI check is a convenience; every admin function re-checks is_admin() in the database.
async function requireAdmin(locals: App.Locals) {
	if (!locals.user) error(401);
	const { data } = await locals.supabase.from('profiles').select('role').eq('id', locals.user.id).maybeSingle();
	if (data?.role !== 'admin') error(404, 'Not found');
}

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireAdmin(locals);
	const status = ['open', 'actioned', 'dismissed'].includes(url.searchParams.get('status') ?? '') ? url.searchParams.get('status')! : 'open';
	const { data, error: err } = await locals.supabase.rpc('admin_report_queue', { p_status: status });
	return { items: (data ?? []) as QueueItem[], status, error: err ? 'The queue didn’t load.' : null };
};

const target = (form: FormData) => {
	const type = form.get('target_type');
	const id = String(form.get('target_id') ?? '');
	return { p_post_id: type === 'post' ? id : null, p_comment_id: type === 'comment' ? id : null };
};

export const actions: Actions = {
	moderate: async ({ request, locals }) => {
		await requireAdmin(locals);
		const form = await request.formData();
		const status = String(form.get('status'));
		const { error: err } = await locals.supabase.rpc('admin_moderate', { p_status: status, ...target(form) });
		if (err) return fail(400, { message: err.message });
		return { done: status === 'visible' ? 'Kept visible; reports dismissed.' : `Marked ${status}.` };
	},
	dismiss: async ({ request, locals }) => {
		await requireAdmin(locals);
		const form = await request.formData();
		const { error: err } = await locals.supabase.rpc('admin_dismiss_report', { p_report_id: String(form.get('report_id')) });
		if (err) return fail(400, { message: err.message });
		return { done: 'Report dismissed.' };
	},
	ban: async ({ request, locals }) => {
		await requireAdmin(locals);
		const form = await request.formData();
		const banned = form.get('banned') === 'true';
		const { error: err } = await locals.supabase.rpc('admin_set_author_ban', { p_banned: banned, ...target(form) });
		if (err) return fail(400, { message: err.message });
		return { done: banned ? 'Community access paused for this author.' : 'Community access restored.' };
	}
};
