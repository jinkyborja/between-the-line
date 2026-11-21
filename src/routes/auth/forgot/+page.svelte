<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Forgot password — Between the Lines</title></svelte:head>

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
		<h1 class="auth-h1">It happens to all of us.</h1>
		<p class="auth-sub">Enter your email and we’ll send a link to choose a new password.</p>
	</div>

	{#if form?.sent}
		<div role="status" class="flex gap-3 border border-[#C9D6C9] bg-[#EEF2EC] p-4 text-sm leading-[1.55] text-[#33493A]">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" class="mt-0.5 flex-none"><path d="M4 7h16v10H4z" /><path d="m4 7 8 6 8-6" /></svg>
			<span>If an account exists for that address, a reset link is on its way.</span>
		</div>
	{/if}

	<label class="auth-label">
		Email
		<input class="field" type="email" name="email" autocomplete="email" required value={form?.email ?? ''} />
	</label>
	{#if form?.message}<p role="alert" class="notice-err">{form.message}</p>{/if}
	<button class="btn btn-primary" disabled={busy}>{busy ? 'Sending…' : form?.sent ? 'Send again' : 'Send reset link'}</button>
	<a href="/auth/login" class="text-sm font-medium">← Back to sign in</a>
</form>
