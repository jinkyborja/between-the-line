<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import PasswordInput from '#lib/components/PasswordInput.svelte';
	import ReadingScene from '#lib/components/ReadingScene.svelte';
	import GoogleButton from '../GoogleButton.svelte';
	import type { PageProps } from './$types';

	// Full-screen sign-in; deliberately outside the shared auth layout.
	let { data, form }: PageProps = $props();
	let busy = $state(false);
	const q = $derived(data.next !== '/discover' ? `?next=${encodeURIComponent(data.next)}` : '');
</script>

<svelte:head>
	<title>Sign in — Between the Lines</title>
	<meta name="theme-color" content="#2a1f1b" />
</svelte:head>

<div class="login">
	<div class="bg"><ReadingScene /></div>

	<div class="fg">
		<header class="nav">
			<a class="logo" href="/">Between the <em>Lines</em><span>.</span></a>
			<nav class="links" aria-label="Main">
				<a href="/">Home</a>
				<a href="/#features">Explore</a>
				<a class="opt" href="/#about">About</a>
				<a class="opt" href="/#privacy">Privacy</a>
				<a class="pill" href="/auth/signup{q}">Create an account</a>
			</nav>
			<a class="pill m" href="/auth/signup{q}">Join</a>
		</header>

		<main id="main" class="main">
			<section class="copy">
				<p class="eyebrow">A quiet place for what goes unsaid</p>
				<h1 class="h">Every story begins with <em>a feeling.</em></h1>
				<p class="lede">Find a quiet space to read, reflect, and put into words the things you’ve kept inside.</p>
				<blockquote class="quote">“Come in. Leave your coat and whatever you were pretending to be today.”<small>from “Threshold”, Ines Varga</small></blockquote>
			</section>

			<div class="card">
				<div>
					<h2>Welcome back</h2>
					<p class="sub">Your space for words, thoughts, and everything in between.</p>
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

				<GoogleButton {q} />

				<p class="foot">New here? <a href="/auth/signup{q}">Create an account</a></p>
				<p class="privacy"><Icon name="lock" size={14} />Journals and letters stay private. Always.</p>
			</div>
		</main>

		<footer class="legal">
			<span>© 2026 Between the Lines</span>
			<span><a href="/#privacy">Privacy</a> · <a href="/#guidelines">Guidelines</a></span>
		</footer>
	</div>
</div>

<style>
	.login {
		container-type: inline-size;
		position: relative;
		min-height: 100vh;
		min-height: 100dvh;
		overflow: hidden;
		background: #2a1f1b;
	}
	.bg { position: absolute; inset: 0; }
	.fg {
		position: relative;
		z-index: 1;
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		padding: 28px 56px 32px;
	}
	.nav { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
	.logo { font: 400 26px var(--font-serif); letter-spacing: -0.01em; color: #f7f2ea; }
	.logo:hover { color: #f7f2ea; }
	.logo em { font-style: italic; }
	.logo span { color: #c9a89b; }
	.links { display: flex; align-items: center; gap: 32px; }
	.links a:not(.pill) {
		padding: 8px 0;
		border-bottom: 1px solid transparent;
		color: rgb(247 242 234 / 0.82);
		font-size: 14px;
		transition: color var(--t2), border-color var(--t2);
	}
	.links a:not(.pill):hover { color: #f7f2ea; border-bottom-color: #c9a89b; }
	.pill {
		display: inline-flex;
		align-items: center;
		min-height: 40px;
		padding: 0 18px;
		border: 1px solid rgb(247 242 234 / 0.4);
		border-radius: 999px;
		color: #f7f2ea;
		font-size: 13.5px;
		font-weight: 500;
		transition: background-color var(--t2), border-color var(--t2), color var(--t2);
	}
	.pill:hover { background: #f7f2ea; border-color: #f7f2ea; color: #3b2d27; }
	.pill.m { display: none; }
	.nav a:focus-visible, .legal a:focus-visible { outline-color: #c9a89b; }

	.main {
		flex: 1;
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(380px, 440px);
		align-items: center;
		gap: 72px;
		padding: 40px 0;
	}
	.copy { max-width: 600px; display: flex; flex-direction: column; gap: 26px; animation: rise 1.1s var(--ease-out) 0.25s both; }
	.eyebrow {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 14px;
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: #d8bcae;
	}
	.eyebrow::before { content: ''; width: 36px; height: 1px; background: #c9a89b; }
	.h {
		margin: 0;
		font: 300 clamp(46px, 5.4vw, 80px) / 1.02 var(--font-serif);
		letter-spacing: -0.025em;
		color: #f7f2ea;
		text-wrap: balance;
	}
	.h em { color: #d8b4a5; }
	.lede { margin: 0; max-width: 440px; font-size: 17px; line-height: 1.7; color: #eae0d3; }
	.quote {
		margin: 12px 0 0;
		padding-left: 18px;
		border-left: 1px solid rgb(201 168 155 / 0.6);
		font: italic 400 17px / 1.6 var(--font-serif);
		color: rgb(234 224 211 / 0.85);
	}
	.quote small { display: block; margin-top: 6px; font: 400 12px var(--font-sans); letter-spacing: 0.04em; color: rgb(234 224 211 / 0.7); }

	/* The form card keeps the light palette in both themes, for contrast on the scene. */
	.card {
		--color-sheet: #fdfbf7;
		--color-card: #fbf8f3;
		--color-line: #e4dacd;
		--color-line-strong: #dccfc0;
		--color-line-hover: #cfc2b1;
		--color-ink: #231d1a;
		--color-ink-2: #2b2522;
		--color-espresso: #3b2d27;
		--color-body: #4a3f38;
		--color-muted: #5e534c;
		--color-subtle: #6f625a;
		--color-rose: #8a5548;
		--color-rose-dark: #6b3f35;
		--color-danger: #8e3a40;
		--color-mocha: #8c7568;
		--color-beige: #eae0d3;
		color-scheme: light;
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding: 40px 40px 32px;
		background: rgb(247 242 234 / 0.96);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		border: 1px solid rgb(255 255 255 / 0.55);
		border-radius: 14px;
		box-shadow: 0 40px 80px -30px rgb(15 9 7 / 0.65), 0 2px 0 rgb(255 255 255 / 0.4) inset;
		color: #3b2d27;
		animation: cardIn 1s var(--ease-out) 0.45s both;
	}
	.card h2 { margin: 0; font: 400 36px / 1.1 var(--font-serif); letter-spacing: -0.015em; color: #2b211d; }
	.card .sub { margin: 8px 0 0; font-size: 14.5px; line-height: 1.6; color: #5e534c; }
	.card :global(.field) { height: 50px; border-radius: 8px; font-size: 15px; }
	.card :global(.btn) { border-radius: 8px; }
	.card :global(.notice-err) { border-radius: 8px; }
	.go:hover:not(:disabled) { box-shadow: 0 12px 24px -14px rgb(59 45 39 / 0.8); }
	.arr { display: inline-flex; transition: transform var(--t2) var(--ease-out); }
	.go:hover .arr { transform: translateX(3px); }
	.foot { margin: 0; text-align: center; font-size: 14px; color: #5e534c; }
	.foot a { font-weight: 600; }
	.privacy {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: 0;
		padding-top: 16px;
		border-top: 1px solid #ece3d7;
		font-size: 12.5px;
		color: #6f625a;
	}
	.legal { display: flex; justify-content: space-between; gap: 16px; font-size: 12.5px; color: rgb(234 224 211 / 0.7); }
	.legal a { color: rgb(234 224 211 / 0.8); }
	.legal a:hover { color: #f7f2ea; }

	@keyframes rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
	@keyframes cardIn { from { opacity: 0; transform: translateY(24px) scale(0.985); } to { opacity: 1; transform: none; } }
	@media (prefers-reduced-motion: reduce) {
		.copy, .card { animation: none; }
	}

	/* Tablet */
	@container (max-width: 1100px) {
		.fg { padding: 24px 36px 28px; }
		.main { grid-template-columns: minmax(0, 1fr) minmax(340px, 400px); gap: 44px; }
		.links { gap: 22px; }
		.links .opt, .quote { display: none; }
	}
	/* Phone: scene becomes a top band, the form sits on ivory below. */
	@container (max-width: 760px) {
		.bg { bottom: auto; height: 360px; }
		.fg { padding: 18px 20px 24px; background: linear-gradient(180deg, transparent 360px, #f7f2ea 360px); }
		.links { display: none; }
		.pill.m { display: inline-flex; min-height: 40px; padding: 0 16px; font-size: 13px; }
		.main { grid-template-columns: 1fr; gap: 28px; padding: 44px 0 8px; align-items: start; }
		.copy { gap: 14px; }
		.eyebrow { font-size: 10.5px; }
		.h { font-size: 38px; }
		.lede { font-size: 15px; line-height: 1.6; color: #f3ece2; }
		.card { padding: 28px 22px 24px; background: #f7f2ea; backdrop-filter: none; -webkit-backdrop-filter: none; box-shadow: 0 24px 50px -30px rgb(15 9 7 / 0.55); }
		.card h2 { font-size: 30px; }
		.card :global(.field) { font-size: 16px; }
		.legal { flex-direction: column; align-items: center; text-align: center; gap: 6px; color: #6f625a; }
		.legal a { color: #5e534c; }
	}
</style>
