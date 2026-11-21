<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let password = $state('');
	let confirm = $state('');
	const mismatch = $derived(confirm.length > 0 && confirm !== password);
	const matches = $derived(confirm.length > 0 && confirm === password);
</script>

<svelte:head><title>Choose a new password — Between the Lines</title></svelte:head>

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
		<p class="auth-eyebrow">Reset password</p>
		<h1 class="auth-h1">Choose a new password.</h1>
		<p class="auth-sub">For <strong class="font-medium text-ink">{data.email}</strong>. Use at least 10 characters.</p>
	</div>
	<div class="flex flex-col gap-2">
		<label for="reset-password" class="auth-label">New password</label>
		<PasswordInput id="reset-password" name="password" minlength={10} autocomplete="new-password" required bind:value={password} />
		<PasswordMeter {password} />
	</div>
	<div class="flex flex-col gap-2">
		<label for="reset-confirm" class="auth-label">Confirm new password</label>
		<PasswordInput id="reset-confirm" name="confirm" autocomplete="new-password" required bind:value={confirm} aria-invalid={mismatch} aria-describedby="reset-confirm-msg" />
		<span id="reset-confirm-msg" aria-live="polite">
			{#if mismatch}<span class="field-error">These don’t match yet.</span>
			{:else if matches}<span class="field-hint"><Icon name="check" size={13} />Passwords match.</span>{/if}
		</span>
	</div>
	{#if form?.message}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.message}</p>{/if}
	<button class="btn btn-primary btn-lg" disabled={busy || mismatch} aria-busy={busy}>
		{#if busy}<span class="spin" aria-hidden="true"></span>Saving…{:else}Save and sign in{/if}
	</button>
</form>
