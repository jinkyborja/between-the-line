<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import GoogleButton from '../GoogleButton.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
	const q = $derived(data.next !== '/discover' ? `?next=${encodeURIComponent(data.next)}` : '');
</script>

<svelte:head><title>Sign in — Between the Lines</title></svelte:head>

<div class="page-in flex flex-col gap-6">
	<div class="auth-head">
		<p class="auth-eyebrow">Sign in</p>
		<h1 class="auth-h1">Welcome back.</h1>
		<p class="auth-sub">Your journal is right where you left it.</p>
	</div>

	{#if data.authError}
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
			<input class="field" type="email" name="email" placeholder="you@example.com" autocomplete="email" required value={form?.email ?? ''} />
		</label>
		<div class="flex flex-col gap-2">
			<div class="flex items-baseline justify-between gap-3">
				<label for="login-password" class="auth-label">Password</label>
				<a href="/auth/forgot" class="text-[13px] font-medium">Forgot password?</a>
			</div>
			<PasswordInput id="login-password" name="password" autocomplete="current-password" required />
		</div>
		<label class="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-body">
			<input type="checkbox" name="remember" checked class="size-[18px] accent-espresso" />Keep me signed in on this device
		</label>
		{#if form?.message}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.message}</p>{/if}
		<button class="btn btn-primary btn-lg" disabled={busy} aria-busy={busy}>
			{#if busy}<span class="spin" aria-hidden="true"></span>Opening your journal…{:else}Sign in{/if}
		</button>
	</form>

	<GoogleButton {q} />

	<p class="auth-foot">New here? <a href="/auth/signup{q}" class="font-medium">Create an account</a></p>
</div>
