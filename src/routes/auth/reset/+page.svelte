<script lang="ts">
	import { enhance } from '$app/forms';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let password = $state('');
	let confirm = $state('');
	const mismatch = $derived(confirm.length > 0 && confirm !== password);
</script>

<svelte:head><title>Choose a new password — Between the Lines</title></svelte:head>

<form
	method="POST"
	class="page-in flex flex-col gap-5"
	use:enhance={() => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false });
			busy = false;
		};
	}}
>
	<div class="flex flex-col gap-2.5">
		<h1 class="auth-h1">Choose a new password.</h1>
		<p class="auth-sub">For {data.email}</p>
	</div>
	<label class="auth-label">
		New password
		<input class="field" type="password" name="password" minlength="10" autocomplete="new-password" required bind:value={password} />
	</label>
	<PasswordMeter {password} />
	<label class="auth-label">
		Confirm password
		<input class="field" type="password" name="confirm" autocomplete="new-password" required bind:value={confirm} aria-invalid={mismatch} />
		{#if mismatch}<span class="text-xs font-normal text-danger">These don’t match yet.</span>{/if}
	</label>
	{#if form?.message}<p role="alert" class="notice-err">{form.message}</p>{/if}
	<button class="btn btn-primary" disabled={busy || mismatch}>{busy ? 'Saving…' : 'Save and sign in'}</button>
</form>
