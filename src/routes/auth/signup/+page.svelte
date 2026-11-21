<script lang="ts">
	import { enhance } from '$app/forms';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import GoogleButton from '../GoogleButton.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let password = $state('');
	const q = $derived(data.next !== '/discover' ? `?next=${encodeURIComponent(data.next)}` : '');
</script>

<svelte:head><title>Create an account — Between the Lines</title></svelte:head>

{#if form?.sent}
	<div class="page-in flex flex-col gap-6">
		<span class="inline-flex size-14 items-center justify-center rounded-full bg-rose-tint text-rose"><Icon name="envelope" size={24} /></span>
		<div class="auth-head">
			<p class="auth-eyebrow">One more step</p>
			<h1 class="auth-h1">Check your inbox.</h1>
			<p class="auth-sub">
				We sent a link to <strong class="font-medium text-ink">{form.email}</strong>. Open it to finish making your space.
			</p>
		</div>
		<p class="notice-ok"><Icon name="check" size={18} />It can take a minute to arrive. If you don’t see it, check your spam folder.</p>
		<a href="/auth/login{q}" class="inline-flex items-center gap-1.5 text-sm font-medium"><Icon name="back" size={16} />Back to sign in</a>
	</div>
{:else}
	<div class="page-in flex flex-col gap-6">
		<div class="auth-head">
			<p class="auth-eyebrow">Create an account</p>
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
				<span class="field-hint"><Icon name="lock" size={13} />Only you see this. The community never shows names.</span>
			</label>
			<label class="auth-label">
				Email
				<input class="field" type="email" name="email" placeholder="you@example.com" autocomplete="email" required value={form?.email ?? ''} />
			</label>
			<div class="flex flex-col gap-2">
				<label for="signup-password" class="auth-label">Password</label>
				<PasswordInput id="signup-password" name="password" minlength={10} placeholder="At least 10 characters" autocomplete="new-password" required bind:value={password} aria-describedby="signup-meter" />
				<div id="signup-meter"><PasswordMeter {password} /></div>
			</div>
			{#if form?.message}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.message}</p>{/if}
			<button class="btn btn-primary btn-lg" disabled={busy} aria-busy={busy}>
				{#if busy}<span class="spin" aria-hidden="true"></span>Making your space…{:else}Create my account{/if}
			</button>
		</form>

		<GoogleButton {q} />

		<p class="auth-foot">Already have an account? <a href="/auth/login{q}" class="font-medium">Sign in</a></p>
		<p class="m-0 text-xs leading-relaxed text-subtle">
			By continuing you agree to our <a href="/#guidelines">Guidelines</a> and <a href="/#privacy">Privacy</a> promises.
		</p>
	</div>
{/if}
