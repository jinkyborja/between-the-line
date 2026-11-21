<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import GoogleButton from '../GoogleButton.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let password = $state('');
	const q = $derived(data.next !== '/discover' ? `?next=${encodeURIComponent(data.next)}` : '');
</script>

<svelte:head><title>Create your journal — Between the Lines</title></svelte:head>

{#if form?.sent}
	<div class="page-in flex flex-col gap-5">
		<span class="inline-flex size-12 items-center justify-center rounded-full bg-rose-tint text-rose">
			<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 7h16v10H4z" /><path d="m4 7 8 6 8-6" /></svg>
		</span>
		<h1 class="auth-h1">Check your inbox.</h1>
		<p class="auth-sub">
			We sent a link to <strong class="font-medium text-ink">{form.email}</strong>. Open it to finish making your space.
			It may take a minute or land in spam.
		</p>
		<a href="/auth/login{q}" class="text-sm font-medium">← Back to sign in</a>
	</div>
{:else}
	<div class="page-in flex flex-col gap-5">
		<div class="flex flex-col gap-2.5">
			<h1 class="auth-h1">Make a space for yourself.</h1>
			<p class="auth-sub">It only takes a moment. No one will see anything you write unless you choose.</p>
		</div>

		<form
			method="POST"
			action="?/password{q ? '&' + q.slice(1) : ''}"
			class="flex flex-col gap-5"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<label class="auth-label">
				What should we call you?
				<input class="field" type="text" name="name" maxlength="60" placeholder="A first name or a pen name" autocomplete="nickname" required value={form?.name ?? ''} />
				<span class="flex items-center gap-1.5 text-xs font-normal text-subtle"><Icon name="lock" size={13} />Only you will see this. The community never shows names.</span>
			</label>
			<label class="auth-label">
				Email
				<input class="field" type="email" name="email" placeholder="you@example.com" autocomplete="email" required value={form?.email ?? ''} />
			</label>
			<label class="auth-label">
				Password
				<input class="field" type="password" name="password" minlength="10" placeholder="At least 10 characters" autocomplete="new-password" required bind:value={password} />
			</label>
			<PasswordMeter {password} />
			{#if form?.message}<p role="alert" class="notice-err">{form.message}</p>{/if}
			<button class="btn btn-primary" disabled={busy}>{busy ? 'Making your space…' : 'Create my journal'}</button>
		</form>

		<GoogleButton {q} />

		<p class="m-0 text-[13px] leading-relaxed text-muted">
			By continuing you agree to our <a href="/#guidelines">Guidelines</a> and <a href="/#privacy">Privacy</a>.
			Already have an account? <a href="/auth/login{q}">Sign in</a>
		</p>
	</div>
{/if}
