<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import ImmersiveAuth from '#lib/components/ImmersiveAuth.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head>
	<title>Forgot password — Between the Lines</title>
	<meta name="theme-color" content="#2a1f1b" />
</svelte:head>

<ImmersiveAuth
	lede="It happens to all of us. We’ll send a link so you can choose a new password and find your way back."
	quote={false}
	pill={{ href: '/auth/login', label: 'Sign in', short: 'Sign in' }}
>
	{#snippet heading()}Lost the key? <em>Your words are waiting.</em>{/snippet}

	<div>
		<h2>Forgot password</h2>
		<p class="sub">Enter the email you signed up with and we’ll send a link to choose a new password.</p>
	</div>

	{#if form?.sent}
		<p role="status" class="notice-ok">
			<Icon name="check" size={18} />
			<span>If an account exists for <strong class="font-medium">{form.email}</strong>, a reset link is on its way. Check your spam folder too.</span>
		</p>
	{/if}

	<form
		method="POST"
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
			Email
			<input class="field" type="email" name="email" placeholder="you@example.com" autocomplete="email" required value={form?.email ?? ''} aria-invalid={form?.message ? true : undefined} />
		</label>
		{#if form?.message}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.message}</p>{/if}
		<button class="btn btn-primary btn-lg go" disabled={busy} aria-busy={busy}>
			{#if busy}<span class="spin" aria-hidden="true"></span>Sending…{:else}{form?.sent ? 'Send again' : 'Send reset link'} <span class="arr" aria-hidden="true"><Icon name="arrow" size={18} /></span>{/if}
		</button>
	</form>

	<p class="foot">Remembered it? <a href="/auth/login">Back to sign in</a></p>
	<p class="privacy"><Icon name="lock" size={14} />We never reveal whether an email has an account.</p>
</ImmersiveAuth>
