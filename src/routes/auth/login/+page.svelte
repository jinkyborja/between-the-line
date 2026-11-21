<script lang="ts">
	import { enhance } from '$app/forms';
	import GoogleButton from '../GoogleButton.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
	const q = $derived(data.next !== '/discover' ? `?next=${encodeURIComponent(data.next)}` : '');
</script>

<svelte:head><title>Sign in — Between the Lines</title></svelte:head>

<div class="page-in flex flex-col gap-5">
	<div class="flex flex-col gap-2.5">
		<h1 class="auth-h1">Welcome back.</h1>
		<p class="auth-sub">Your journal is right where you left it.</p>
	</div>

	{#if data.authError}
		<p role="alert" class="notice-err">That link didn’t work — it may have expired. Please try again.</p>
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
			<input class="field" type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
		</label>
		<label class="auth-label">
			<span class="flex justify-between">Password<a href="/auth/forgot" class="font-medium">Forgot it?</a></span>
			<input class="field" type="password" name="password" autocomplete="current-password" required />
		</label>
		<label class="flex min-h-11 items-center gap-2.5 text-sm text-ink-2">
			<input type="checkbox" name="remember" checked class="size-[18px] accent-espresso" />Keep me signed in on this device
		</label>
		{#if form?.message}<p role="alert" class="notice-err">{form.message}</p>{/if}
		<button class="btn btn-primary" disabled={busy}>{busy ? 'Opening your journal…' : 'Sign in'}</button>
	</form>

	<GoogleButton {q} />

	<p class="m-0 text-[13px] text-muted">New here? <a href="/auth/signup{q}">Create an account</a></p>
</div>
