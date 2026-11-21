<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Forgot password — Between the Lines</title></svelte:head>

<form
	method="POST"
	class="page-in flex flex-col gap-6"
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
		};
	}}
>
	<div class="auth-head">
		<p class="auth-eyebrow">Forgot password</p>
		<h1 class="auth-h1">It happens to all of us.</h1>
		<p class="auth-sub">Enter the email you signed up with and we’ll send a link to choose a new password.</p>
	</div>

	{#if form?.sent}
		<p role="status" class="notice-ok">
			<Icon name="check" size={18} />
			<span>If an account exists for <strong class="font-medium">{form.email}</strong>, a reset link is on its way. Check your spam folder too.</span>
		</p>
	{/if}

	<label class="auth-label">
		Email
		<input class="field" type="email" name="email" placeholder="you@example.com" autocomplete="email" required value={form?.email ?? ''} />
	</label>
	{#if form?.message}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.message}</p>{/if}
	<button class="btn btn-primary btn-lg" disabled={busy} aria-busy={busy}>
		{#if busy}<span class="spin" aria-hidden="true"></span>Sending…{:else}{form?.sent ? 'Send again' : 'Send reset link'}{/if}
	</button>
	<a href="/auth/login" class="inline-flex items-center gap-1.5 self-start text-sm font-medium"><Icon name="back" size={16} />Back to sign in</a>
</form>
