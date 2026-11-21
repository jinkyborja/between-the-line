import { fail, redirect } from '@sveltejs/kit';
import { MIN_PASSWORD, isEmail } from '#lib/server/auth.ts';
import { serviceClient } from '#lib/server/admin.ts';
import type { Profile } from '#lib/types.ts';
import type { Actions, PageServerLoad } from './$types';

type SettingsProfile = Pick<Profile, 'display_name' | 'bio' | 'theme' | 'text_size'> & {
	notify_comments: boolean;
	notify_appreciation: boolean;
};

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const [profile, entries] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('display_name, bio, theme, text_size, notify_comments, notify_appreciation')
			.eq('id', user.id)
			.single<SettingsProfile>(),
		locals.supabase.from('reflections').select('status')
	]);
	const rows = entries.data ?? [];
	return {
		profile: profile.data,
		email: user.email ?? '',
		hasPassword: (user.identities ?? []).some((i) => i.provider === 'email'),
		counts: { saved: rows.filter((r) => r.status === 'saved').length, drafts: rows.filter((r) => r.status === 'draft').length },
		canDelete: !!serviceClient()
	};
};

const ok = (section: string, message: string) => ({ section, ok: message });
const bad = (section: string, message: string) => fail(400, { section, message });

export const actions: Actions = {
	account: async ({ request, locals }) => {
		const form = await request.formData();
		const display_name = String(form.get('display_name') ?? '').trim().slice(0, 60);
		const bio = String(form.get('bio') ?? '').trim().slice(0, 280) || null;
		const email = String(form.get('email') ?? '').trim();
		if (!display_name) return bad('account', 'Please choose a name — a pen name is fine.');

		const { error } = await locals.supabase.from('profiles').update({ display_name, bio }).eq('id', locals.user!.id);
		if (error) return bad('account', 'Your changes didn’t save. Please try again.');

		if (email && email !== locals.user!.email) {
			if (!isEmail(email)) return bad('account', 'That email doesn’t look quite right.');
			const { error: e2 } = await locals.supabase.auth.updateUser({ email });
			if (e2) return bad('account', 'We couldn’t change your email just now.');
			return ok('account', 'Saved. Check both inboxes to confirm your new email.');
		}
		return ok('account', 'Saved.');
	},

	password: async ({ request, locals }) => {
		const form = await request.formData();
		const current = String(form.get('current') ?? '');
		const next = String(form.get('new') ?? '');
		const confirm = String(form.get('confirm') ?? '');
		if (next.length < MIN_PASSWORD) return bad('password', `Please use at least ${MIN_PASSWORD} characters.`);
		if (next !== confirm) return bad('password', 'Those two passwords don’t match.');

		// Re-check the current password before changing it.
		const { error: authErr } = await locals.supabase.auth.signInWithPassword({ email: locals.user!.email!, password: current });
		if (authErr) return bad('password', 'Your current password isn’t right.');

		const { error } = await locals.supabase.auth.updateUser({ password: next });
		if (error) return bad('password', error.message);
		return ok('password', 'Password updated.');
	},

	notifications: async ({ request, locals }) => {
		const form = await request.formData();
		const { error } = await locals.supabase
			.from('profiles')
			.update({ notify_comments: form.get('notify_comments') === 'on', notify_appreciation: form.get('notify_appreciation') === 'on' })
			.eq('id', locals.user!.id);
		if (error) return bad('notifications', 'That didn’t save. Please try again.');
		return ok('notifications', 'Saved.');
	},

	appearance: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		const theme = String(form.get('theme'));
		const text_size = String(form.get('text_size'));
		if (!['light', 'dark', 'system'].includes(theme) || !['S', 'M', 'L'].includes(text_size))
			return bad('appearance', 'Please choose from the options.');
		const { error } = await locals.supabase.from('profiles').update({ theme, text_size }).eq('id', locals.user!.id);
		if (error) return bad('appearance', 'That didn’t save. Please try again.');
		cookies.set('btl_theme', theme, { path: '/', httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365 });
		return ok('appearance', 'Saved.');
	},

	delete: async ({ request, locals, cookies }) => {
		const form = await request.formData();
		if (String(form.get('confirm') ?? '').trim().toLowerCase() !== 'delete')
			return bad('delete', 'Type “delete” to confirm.');

		const admin = serviceClient();
		if (!admin) return bad('delete', 'Account deletion isn’t set up on this server yet. Please contact support.');

		// Deleting the auth user cascades to profiles → reflections, bookmarks,
		// community posts, comments, likes, notifications and reports.
		const { error } = await admin.auth.admin.deleteUser(locals.user!.id);
		if (error) return bad('delete', 'We couldn’t delete your account just now. Nothing was removed.');

		await locals.supabase.auth.signOut();
		cookies.delete('btl_theme', { path: '/' });
		redirect(303, '/?goodbye=1');
	}
};
