<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import ImmersiveAuth from '#lib/components/ImmersiveAuth.svelte';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import PasswordMeter from '#lib/components/PasswordMeter.svelte';
	import type { PageProps } from './$types';

	// Full-screen sign-up; shares the immersive shell with sign-in.
	let { data, form }: PageProps = $props();
	let busy = $state(false);
	let password = $state('');
	const q = $derived(data.next !== '/discover' ? `?next=${encodeURIComponent(data.next)}` : '');
</script>

<svelte:head>
	<title>Create an account — Between the Lines</title>
	<meta name="theme-color" content="#2a1f1b" />
</svelte:head>

<ImmersiveAuth
	lede="Make a private corner for the words you read, the thoughts you keep, and the letters you may never send."
	quote={false}
	pill={{ href: `/auth/login${q}`, label: 'Sign in', short: 'Sign in' }}
>
	{#snippet heading()}Some feelings are hard to explain. <em>Begin here.</em>{/snippet}

	{#if form?.sent}
		<div class="flex flex-col gap-5">
			<span class="inline-flex size-14 items-center justify-center rounded-full bg-rose-tint text-rose"><Icon name="envelope" size={24} /></span>
			<div>
				<h2>Check your inbox</h2>
				<p class="sub">We sent a link to <strong class="font-medium text-ink">{form.email}</strong>. Open it to finish making your space.</p>
			</div>
			<p role="status" class="notice-ok">
				<Icon name="check" size={18} />{form.resent ? 'A new link is on its way.' : 'It can take a minute to arrive.'} If you don’t see it, check your spam folder.
			</p>
			{#if form?.resendError}<p role="alert" class="notice-err"><Icon name="alert" size={18} />{form.resendError}</p>{/if}
			<form
				method="POST"
				action="?/resend{q ? '&' + q.slice(1) : ''}"
				class="flex flex-col"
				use:enhance={() => {
					busy = true;
					return async ({ update }) => {
						await update({ reset: false });
						busy = false;
					};
				}}
			>
				<input type="hidden" name="email" value={form.email} />
				<button class="btn btn-primary btn-lg w-full" disabled={busy} aria-busy={busy}>
					{#if busy}<span class="spin" aria-hidden="true"></span>Sending…{:else}Resend verification email{/if}
				</button>
			</form>
			<a href="/auth/login{q}" class="btn btn-ghost btn-lg">Back to sign in</a>
		</div>
	{:else}
		<div>
			<h2>Create your space</h2>
			<p class="sub">It only takes a moment. No one will see what you write unless you choose.</p>
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
			<button class="btn btn-primary btn-lg go" disabled={busy} aria-busy={busy}>
				{#if busy}<span class="spin" aria-hidden="true"></span>Making your space…{:else}Create my account <span class="arr" aria-hidden="true"><Icon name="arrow" size={18} /></span>{/if}
			</button>
		</form>

		<p class="foot">Already have an account? <a href="/auth/login{q}">Sign in</a></p>
		<p class="privacy">
			<Icon name="lock" size={14} /><span>By continuing you agree to our <a href="/#guidelines">Guidelines</a> and <a href="/#privacy">Privacy</a> promises.</span>
		</p>
	{/if}
</ImmersiveAuth>
