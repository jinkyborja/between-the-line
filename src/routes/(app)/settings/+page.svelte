<script lang="ts">
	import { enhance } from '$app/forms';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import { untrack } from 'svelte';
	import type { IconName } from '#lib/icons.ts';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import type { SubmitFunction } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const p = untrack(() => data.profile);
	let bio = $state(p?.bio ?? '');
	let newPassword = $state('');
	let theme = $state(p?.theme ?? 'light');
	let size = $state(p?.text_size ?? 'M');
	let confirmText = $state('');
	let deleteOpen = $state(false);
	let deleteEl = $state<HTMLDialogElement>();
	let busy = $state('');

	$effect(() => {
		if (!deleteEl) return;
		if (deleteOpen && !deleteEl.open) deleteEl.showModal();
		if (!deleteOpen && deleteEl.open) deleteEl.close();
	});

	// Preview the theme immediately; the server also stores it.
	$effect(() => {
		document.documentElement.dataset.theme = theme;
	});

	const submit =
		(section: string, reset = false): SubmitFunction =>
		() => {
			busy = section;
			return async ({ update }) => {
				await update({ reset });
				busy = '';
				if (section === 'password') newPassword = '';
			};
		};

	const msg = (section: string) => (form?.section === section ? form : null);
	const sections = [
		['account', 'Account'],
		['password', 'Password'],
		['notifications', 'Notifications'],
		['appearance', 'Appearance'],
		['privacy', 'Privacy'],
		['data', 'Your data']
	];
	const sizes = { S: '17px', M: '19px', L: '22px' } as const;
</script>

<svelte:head><title>Settings — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-10">
	<PageHeader title="Settings" lede="Your account, your space, and how Between the Lines feels to use." />

	<div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
		<nav aria-label="Settings sections" class="snavs">
			{#each sections as [id, label] (id)}<a href="#{id}" class="snav">{label}</a>{/each}
		</nav>

		<div class="flex min-w-0 flex-col gap-6">
			<!-- Account -->
			<section id="account" class="card scroll-mt-24 flex flex-col gap-6">
				<div class="flex flex-col gap-1.5"><h2 class="sh">Account</h2><p class="sd">Your name is only ever shown to you. The community never sees it.</p></div>
				<form method="POST" action="?/account" class="flex flex-col gap-5" use:enhance={submit('account')}>
					<label class="auth-label">Display name<input class="field" name="display_name" maxlength="60" required value={p?.display_name ?? ''} /></label>
					<label class="auth-label">
						Short note to yourself <span class="font-normal text-subtle">(private)</span>
						<textarea class="field" name="bio" rows="3" maxlength="280" bind:value={bio}></textarea>
						<span class="self-end text-xs font-normal text-subtle">{bio.length} / 280</span>
					</label>
					<label class="auth-label">Email<input class="field" type="email" name="email" autocomplete="email" value={data.email} /></label>
					{@render feedback('account')}
					<button class="btn btn-primary self-start" disabled={busy === 'account'}>{busy === 'account' ? 'Saving…' : 'Save changes'}</button>
				</form>
			</section>

			<!-- Password -->
			<section id="password" class="card scroll-mt-24 flex flex-col gap-6">
				<div class="flex flex-col gap-1.5"><h2 class="sh">Password</h2>
					<p class="sd">{data.hasPassword ? 'Choose something long and memorable.' : 'You sign in with Google, so there’s no password to change here.'}</p></div>
				{#if data.hasPassword}
					<form method="POST" action="?/password" class="flex flex-col gap-5" use:enhance={submit('password', true)}>
						<label class="auth-label">Current password<PasswordInput name="current" autocomplete="current-password" required /></label>
						<label class="auth-label">New password<PasswordInput name="new" minlength={10} autocomplete="new-password" required bind:value={newPassword} /></label>
						<PasswordMeter password={newPassword} />
						<label class="auth-label">Confirm new password<PasswordInput name="confirm" autocomplete="new-password" required /></label>
						{@render feedback('password')}
						<button class="btn btn-primary self-start" disabled={busy === 'password'}>{busy === 'password' ? 'Updating…' : 'Update password'}</button>
					</form>
				{/if}
			</section>

			<!-- Notifications -->
			<section id="notifications" class="card scroll-mt-24 flex flex-col gap-6">
				<div class="flex flex-col gap-1.5"><h2 class="sh">Notifications</h2><p class="sd">Gentle, in-app only. We never email you about the community.</p></div>
				<form method="POST" action="?/notifications" class="flex flex-col gap-3" use:enhance={submit('notifications')}>
					{#each [['notify_comments', 'Replies to my anonymous posts', 'When someone answers something you shared.', p?.notify_comments ?? true], ['notify_appreciation', '“Felt this” on my posts', 'At most one note per post until you read it.', p?.notify_appreciation ?? true]] as [name, label, desc, checked] (name)}
						<label class="toggle">
							<span class="flex flex-col gap-1"><span class="text-sm font-semibold text-ink">{label}</span><span class="text-[13px] text-muted">{desc}</span></span>
							<input type="checkbox" role="switch" name={String(name)} checked={Boolean(checked)} />
						</label>
					{/each}
					{@render feedback('notifications')}
					<button class="btn btn-primary mt-2 self-start" disabled={busy === 'notifications'}>Save</button>
				</form>
			</section>

			<!-- Appearance -->
			<section id="appearance" class="card scroll-mt-24 flex flex-col gap-6">
				<div class="flex flex-col gap-1.5"><h2 class="sh">Appearance</h2><p class="sd">Make reading and writing comfortable for your eyes.</p></div>
				<form method="POST" action="?/appearance" class="flex flex-col gap-6" use:enhance={submit('appearance')}>
					<fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
						<legend class="eyebrow mb-3 text-subtle">Theme</legend>
						<div role="radiogroup" aria-label="Theme" class="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
							{#each [['light', 'Paper', 'Warm and bright'], ['dark', 'Lamplight', 'Easy at night'], ['system', 'Match device', 'Follows your system']] as [k, label, desc] (k)}
								<label class="choice"><input class="sr-only" type="radio" name="theme" value={k} bind:group={theme} /><span class="text-sm font-semibold text-ink">{label}</span><span class="text-xs text-muted">{desc}</span></label>
							{/each}
						</div>
					</fieldset>
					<fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
						<legend class="eyebrow mb-3 text-subtle">Reading size</legend>
						<div class="flex gap-2">
							{#each [['S', 'Small'], ['M', 'Medium'], ['L', 'Large']] as [k, label] (k)}
								<label class="chip cursor-pointer has-[:checked]:border-espresso has-[:checked]:bg-espresso has-[:checked]:text-cream"><input class="sr-only" type="radio" name="text_size" value={k} bind:group={size} />{label}</label>
							{/each}
						</div>
						<p class="m-0 border border-line bg-sheet p-5 font-serif leading-[1.7] text-ink-3 transition-[font-size] duration-300" style="font-size: {sizes[size as keyof typeof sizes]}">
							I am learning to pour for one without calling it less.
						</p>
					</fieldset>
					{@render feedback('appearance')}
					<button class="btn btn-primary self-start" disabled={busy === 'appearance'}>Save</button>
				</form>
			</section>

			<!-- Privacy (how it works; enforced in the database, not by settings) -->
			<section id="privacy" class="card scroll-mt-24 flex flex-col gap-5">
				<div class="flex flex-col gap-1.5"><h2 class="sh">Privacy</h2><p class="sd">These protections are always on. They’re built into the database, so no setting can switch them off.</p></div>
				<ul class="m-0 flex list-none flex-col p-0">
					{#each [['lock', 'Journal and letters', 'Only you. Not other readers, not moderators.'], ['community', 'Community posts and replies', 'Always shown as Anonymous. Your name and email are never attached.'], ['shield', 'Moderation', 'Moderators can act on reported posts without learning who wrote them.'], ['account', 'Your account page', 'Visible to you alone — there are no public profiles.']] as [icon, title, text] (title)}
						<li class="flex items-start gap-3.5 border-t border-line-soft py-3.5 first:border-t-0 first:pt-0">
							<span class="pico"><Icon name={icon as IconName} size={16} /></span>
							<span class="flex flex-col gap-0.5"><span class="text-sm font-semibold text-ink">{title}</span><span class="text-[13px] leading-relaxed text-muted">{text}</span></span>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Your data -->
			<section id="data" class="card scroll-mt-24 flex flex-col gap-6">
				<div class="flex flex-col gap-1.5"><h2 class="sh">Your data</h2><p class="sd">Everything you write belongs to you.</p></div>
				<a class="btn btn-ghost self-start" href="/settings/export" download>Download my journal (Markdown)</a>

				<div class="flex flex-col gap-3 border border-[#E8CCC8] bg-[#F8ECEA] p-6 dark-danger">
					<h3 class="m-0 font-serif text-2xl font-normal text-ink">Delete account</h3>
					<p class="m-0 text-sm leading-relaxed text-ink-3">
						This permanently removes your journal, drafts, bookmarks and every anonymous post and reply. We can’t bring them back afterwards.
						Before you go, you can <a href="/settings/export" download>download everything you’ve written</a>.
					</p>
					{@render feedback('delete')}
					<button class="btn btn-ghost self-start border-danger! text-danger!" onclick={() => { confirmText = ''; deleteOpen = true; }}>Delete my account…</button>
				</div>
			</section>
		</div>
	</div>
</div>

{#snippet feedback(section: string)}
	{@const m = msg(section)}
	{#if m && 'ok' in m}<p role="status" class="m-0 text-sm text-[#4F6B55]">{m.ok}</p>{/if}
	{#if m && 'message' in m}<p role="alert" class="notice-err">{m.message}</p>{/if}
{/snippet}

<dialog class="modal" bind:this={deleteEl} aria-labelledby="dat" oncancel={(e) => { e.preventDefault(); deleteOpen = false; }}>
	<form method="POST" action="?/delete" class="flex flex-col gap-4 p-7 sm:p-9" use:enhance={() => { busy = 'delete'; return async ({ update }) => { await update(); busy = ''; deleteOpen = false; }; }}>
		<h3 id="dat" class="m-0 font-serif text-[26px] font-normal text-ink">Are you sure?</h3>
		<p class="m-0 text-[15px] leading-relaxed text-muted">
			{data.counts.saved} {data.counts.saved === 1 ? 'reflection' : 'reflections'} and {data.counts.drafts} {data.counts.drafts === 1 ? 'draft' : 'drafts'} will be erased, along with everything else. Type <strong class="text-ink">delete</strong> to confirm.
		</p>
		{#if !data.canDelete}<p class="notice-err">Account deletion isn’t configured on this server yet (missing service key).</p>{/if}
		<label class="sr-only" for="confirm-del">Type delete to confirm</label>
		<input id="confirm-del" class="field" name="confirm" autocomplete="off" bind:value={confirmText} />
		<div class="mt-1 flex flex-wrap justify-end gap-2.5">
			<button type="button" class="btn btn-ghost" onclick={() => (deleteOpen = false)}>Keep my account</button>
			<button class="btn btn-danger" disabled={confirmText.trim().toLowerCase() !== 'delete' || busy === 'delete' || !data.canDelete}>{busy === 'delete' ? 'Deleting…' : 'Delete forever'}</button>
		</div>
	</form>
</dialog>

<style>
	.card {
		padding: 24px 20px;
		background: var(--color-sheet);
		border: 1px solid var(--color-line);
		border-radius: 2px;
	}
	@media (min-width: 640px) {
		.card {
			padding: 32px;
		}
	}
	.snavs {
		display: flex;
		gap: 6px;
		overflow-x: auto;
		margin: 0 -20px;
		padding: 0 20px 2px;
		scrollbar-width: none;
	}
	@media (min-width: 1024px) {
		.snavs {
			position: sticky;
			top: 32px;
			flex-direction: column;
			gap: 2px;
			margin: 0;
			padding: 0;
			overflow: visible;
		}
	}
	.pico {
		width: 32px;
		height: 32px;
		flex: none;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-beige);
		color: var(--color-espresso);
	}
	.sh {
		margin: 0;
		font-family: var(--font-serif);
		font-weight: 400;
		font-size: 28px;
		color: var(--color-ink);
	}
	.sd {
		margin: 0;
		font-size: 14px;
		color: var(--color-muted);
	}
	.snav {
		flex: none;
		display: flex;
		white-space: nowrap;
		align-items: center;
		min-height: 40px;
		padding: 0 12px;
		border-radius: 2px;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-body);
	}
	.snav:hover {
		background: var(--color-card);
		color: var(--color-ink);
	}
	.toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 16px;
		border: 1px solid var(--color-line);
		background: var(--color-card);
		cursor: pointer;
	}
	.toggle input {
		appearance: none;
		flex: none;
		width: 44px;
		height: 26px;
		border-radius: 999px;
		background: var(--color-line-strong);
		position: relative;
		cursor: pointer;
		transition: background-color var(--t2) var(--ease-out);
	}
	.toggle input::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #fff;
		transition: transform var(--t3) var(--ease-out);
	}
	.toggle input:checked {
		background: var(--color-rose);
	}
	.toggle input:checked::after {
		transform: translateX(18px);
	}
	.choice {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 14px 16px;
		border: 1px solid var(--color-line);
		background: var(--color-card);
		cursor: pointer;
		transition: border-color var(--t2) var(--ease-out);
	}
	.choice:has(input:checked) {
		border-color: var(--color-espresso);
		box-shadow: inset 0 0 0 1px var(--color-espresso);
	}
	.choice:has(input:focus-visible) {
		outline: 2px solid var(--color-rose);
		outline-offset: 2px;
	}
	:global([data-theme='dark']) .dark-danger {
		background: #3a2627;
		border-color: #5a3538;
	}
	dialog {
		width: calc(100% - 32px);
		max-width: 460px;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: var(--color-sheet);
		box-shadow: 0 40px 80px -40px rgb(43 37 34 / 0.55);
	}
</style>
