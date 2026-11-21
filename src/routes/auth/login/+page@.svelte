<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import ImmersiveAuth from '#lib/components/ImmersiveAuth.svelte';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import type { PageProps } from './$types';

	// Full-screen sign-in; deliberately outside the shared auth layout.
	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let resending = $state(false);
	// Offer a new verification email whenever sign-in is blocked by an unverified address.
	const showResend = $derived(
		data.unverified || data.authError === 'verify' || !!(form && 'unconfirmed' in form && form.unconfirmed) || !!form?.resent || !!form?.resendError
	);
	const q = $derived(data.next !== '/discover' ? `?next=${encodeURIComponent(data.next)}` : '');
</script>

<svelte:head>
	<title>Sign in — Between the Lines</title>
	<meta name="theme-color" content="#2a1f1b" />
</svelte:head>

<ImmersiveAuth
	lede="Find a quiet space to read, reflect, and put into words the things you’ve kept inside."
	pill={{ href: `/auth/signup${q}`, label: 'Create an account', short: 'Join' }}
>
	{#snippet heading()}Every story begins with <em>a feeling.</em>{/snippet}

	<div>
		<h2>Welcome back</h2>
		<p class="sub">Your space for words, thoughts, and everything in between.</p>
	</div>

	{#if form?.resent}
		<p role="status" class="notice-ok"><Icon name="check" size={18} /><span>If <strong class="font-medium">{form.email}</strong> is waiting to be verified, a new link is on its way. Check your spam folder too.</span></p>
	{:else if data.verified}
		<p role="status" class="notice-ok"><Icon name="check" size={18} />Your email is verified. Sign in to open your space.</p>
	{:else if data.unverified}
		<p role="alert" class="notice-err"><Icon name="alert" size={18} />Please verify your email before continuing. Check your inbox for the link.</p>
	{:else if data.authError === 'verify'}
		<p role="alert" class="notice-err"><Icon name="alert" size={18} />That verification link didn’t work. It may have expired or already been used. Try signing in, or send a new link below.</p>
	{:else if data.authError}
		<p role="alert" class="notice-err"><Icon name="alert" size={18} />That link didn’t work. It may have expired, so please try again.</p>
	{/if}

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
			Email
			<input class="field" type="email" name="email" placeholder="you@example.com" autocomplete="email" required value={form?.email ?? ''} aria-invalid={form?.message ? true : undefined} />
		</label>
		<div class="flex flex-col gap-2">
			<div class="flex items-baseline justify-between gap-3">
				<label for="login-password" class="auth-label">Password</label>
				<a href="/auth/forgot" class="text-[13px] font-medium">Forgot password?</a>
			</div>
			<PasswordInput id="login-password" name="password" placeholder="Your password" autocomplete="current-password" required aria-invalid={form?.message ? true : undefined} />
		</div>
		<label class="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-body">
			<input type="checkbox" name="remember" checked class="size-[18px] accent-espresso" />Keep me signed in on this device
		</label>
		{#if form?.message}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.message}</p>{/if}
		<button class="btn btn-primary btn-lg go" disabled={busy} aria-busy={busy}>
			{#if busy}<span class="spin" aria-hidden="true"></span>Opening your journal…{:else}Sign in <span class="arr" aria-hidden="true"><Icon name="arrow" size={18} /></span>{/if}
		</button>
	</form>

	{#if showResend}
		<form
			method="POST"
			action="?/resend{q ? '&' + q.slice(1) : ''}"
			class="flex flex-col gap-3 border-t border-line-soft pt-5"
			use:enhance={() => {
				resending = true;
				return async ({ update }) => {
					await update({ reset: false });
					resending = false;
				};
			}}
		>
			<label class="auth-label">
				Didn’t get the verification email?
				<input class="field" type="email" name="email" placeholder="you@example.com" autocomplete="email" required value={form?.email ?? ''} />
			</label>
			{#if form?.resendError}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.resendError}</p>{/if}
			<button class="btn btn-ghost btn-lg w-full" disabled={resending} aria-busy={resending}>
				{#if resending}<span class="spin" aria-hidden="true"></span>Sending…{:else}Resend verification email{/if}
			</button>
		</form>
	{/if}

	<p class="foot">New here? <a href="/auth/signup{q}">Create an account</a></p>
	<p class="privacy"><Icon name="lock" size={14} />Journals and letters stay private. Always.</p>
</ImmersiveAuth>
