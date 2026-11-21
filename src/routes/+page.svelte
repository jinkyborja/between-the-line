<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import { excerpt } from '#lib/poem.ts';
	import type { IconName } from '#lib/icons.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const features: { icon: IconName; title: string; text: string; tag: string }[] = [
		{ icon: 'library', title: 'Poetry & quotes', text: 'Original poems and short lines on love, loss, healing and becoming, set for slow, comfortable reading.', tag: 'Read' },
		{ icon: 'journal', title: 'Private journal', text: 'Write what a poem stirred in you. Moods, prompts and autosave help, and every entry stays yours alone.', tag: 'Private' },
		{ icon: 'envelope', title: 'Letters to myself', text: 'Write to your past, present or future self, or keep the letters you never sent. Set a day to read one again.', tag: 'Private' },
		{ icon: 'community', title: 'Anonymous community', text: 'When you want to, share a separate post. No names, photos or profiles. Just words and gentle replies.', tag: 'Anonymous' }
	];

	const steps: { icon: IconName; title: string; text: string }[] = [
		{ icon: 'search', title: 'Discover words that resonate', text: 'Browse poems and quotes by feeling, or start with the poem of the day.' },
		{ icon: 'pen', title: 'Reflect and write privately', text: 'Answer in your journal or in a letter to yourself. Only you can read it.' },
		{ icon: 'community', title: 'Share anonymously, if you choose', text: 'Sharing is always a separate step you take on purpose. Never automatic.' }
	];

	const promises: { icon: IconName; title: string; text: string }[] = [
		{ icon: 'lock', title: 'Your journal is private', text: 'Entries are visible only to you. Not other readers, not moderators.' },
		{ icon: 'envelope', title: 'Your letters are private', text: 'Letters to yourself, sent or unsent, never leave your account.' },
		{ icon: 'community', title: 'The community is anonymous', text: 'Posts and comments show “Anonymous”. There are no public profiles.' },
		{ icon: 'shield', title: 'Nothing is published for you', text: 'Private writing is never shared automatically. You decide, every time.' }
	];
</script>

<svelte:head>
	<title>Between the Lines: a quiet place for what goes unsaid</title>
	<meta name="description" content="Read poetry, reflect in a private journal, write letters to yourself, and share anonymously when you choose." />
</svelte:head>

<div class="page-in min-h-screen bg-paper">
	<a href="#main" class="skip">Skip to content</a>

	<header class="top">
		<nav aria-label="Main" class="wrap flex items-center justify-between gap-4 py-4">
			<Wordmark size={24} />
			<div class="flex items-center gap-2 sm:gap-6">
				<a class="navlink hidden md:inline-flex" href="#about">About</a>
				<a class="navlink hidden md:inline-flex" href="#features">Features</a>
				<a class="navlink hidden md:inline-flex" href="#privacy">Privacy</a>
				<a class="navlink inline-flex px-2" href="/auth/login">Sign in</a>
				<a class="btn btn-primary hidden sm:inline-flex" href="/auth/signup">Create an account</a>
			</div>
		</nav>
	</header>

	<main id="main">
		<!-- Hero -->
		<div class="relative overflow-hidden">
			<div class="glow" aria-hidden="true"></div>
			<section class="wrap hero relative">
				<div class="fade flex flex-col gap-7">
					<p class="eyebrow m-0 text-xs text-rose">A quiet place for what goes unsaid</p>
					<h1 class="m-0 font-serif text-[clamp(38px,5.6vw,72px)] leading-[1.04] font-light tracking-[-0.025em] text-balance text-ink">
						Some feelings are difficult to explain. <em class="text-rose">Here, you don’t have to.</em>
					</h1>
					<p class="m-0 max-w-[520px] text-[17px] leading-[1.7] text-muted sm:text-lg">
						Read short poems and quotes, then write what they stir in you: in a private journal, in letters to yourself, or
						anonymously with people who understand.
					</p>
					<div class="flex flex-wrap gap-3">
						<a class="btn btn-primary btn-lg" href="/auth/signup">Create an account <span class="arr"><Icon name="arrow" size={18} /></span></a>
						<a class="btn btn-ghost btn-lg" href="#features">Explore the space</a>
					</div>
					<p class="m-0 flex items-center gap-2 text-[13px] text-subtle">
						<Icon name="lock" size={16} />Free. Private by default. Sharing is always your choice.
					</p>
				</div>

				{#if data.poem}
					<figure class="fade2 relative m-0">
						<div aria-hidden="true" class="paper-back"></div>
						<div class="relative rounded-xs border border-line bg-sheet px-7 pt-9 pb-8 shadow-raised sm:px-12 sm:pt-12 sm:pb-10">
							<p class="eyebrow m-0 mb-7 text-rose">Poem of the day{data.poem.category ? ` · ${data.poem.category.name}` : ''}</p>
							<h2 class="m-0 mb-6 font-serif text-[28px] font-normal tracking-[-0.01em] text-ink sm:text-[34px]">{data.poem.title}</h2>
							<blockquote class="m-0 font-serif text-[18px] leading-[1.75] whitespace-pre-line text-ink-3 sm:text-[20px]">{excerpt(data.poem.body)}</blockquote>
							<div class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-5">
								<cite class="text-sm text-muted not-italic">by {data.poem.author}</cite>
								<a href="/auth/login?next={encodeURIComponent(`/read/${data.poem.slug}`)}" class="inline-flex items-center gap-1.5 text-sm font-medium">Read &amp; reflect <span class="arr"><Icon name="arrow" size={16} /></span></a>
							</div>
						</div>
					</figure>
				{/if}
			</section>
		</div>

		<!-- Purpose -->
		<section id="about" class="band">
			<div class="wrap grid items-center gap-10 py-20 md:grid-cols-[1fr_1.1fr] md:gap-16 lg:py-28">
				<div class="flex flex-col gap-4">
					<p class="eyebrow m-0 text-xs text-[var(--color-dusty)]">Our purpose</p>
					<h2 class="m-0 font-serif text-[clamp(30px,3.6vw,46px)] leading-[1.12] font-light tracking-[-0.02em] text-balance">
						A gentle place to put the things you carry quietly.
					</h2>
				</div>
				<div class="flex flex-col gap-5 text-[16px] leading-[1.75] text-[var(--band-text)]">
					<p class="m-0">
						Some days a poem says what you couldn’t. Other days you need somewhere to write it yourself, without an audience,
						without being judged.
					</p>
					<p class="m-0">
						Between the Lines brings the two together: words to read slowly, and a private space to answer them. No feeds to
						keep up with, no follower counts, no names.
					</p>
				</div>
			</div>
		</section>

		<!-- Features -->
		<section id="features" class="wrap py-20 lg:py-28">
			<div class="mb-12 flex max-w-[620px] flex-col gap-3">
				<p class="eyebrow m-0 text-xs text-subtle">What’s inside</p>
				<h2 class="sec-title">Four quiet rooms, one for each kind of feeling.</h2>
			</div>
			<div class="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
				{#each features as f (f.title)}
					<article class="feature">
						<span class="ficon" aria-hidden="true"><Icon name={f.icon} size={22} /></span>
						<h3 class="m-0 font-serif text-[23px] font-normal text-ink">{f.title}</h3>
						<p class="m-0 flex-1 text-[15px] leading-[1.65] text-muted">{f.text}</p>
						<span class="ftag">{#if f.tag === 'Private'}<Icon name="lock" size={13} />{/if}{f.tag}</span>
					</article>
				{/each}
			</div>
		</section>

		<!-- How it works -->
		<section class="border-y border-line bg-sand-2">
			<div class="wrap py-20 lg:py-28">
				<div class="mb-12 flex max-w-[620px] flex-col gap-3">
					<p class="eyebrow m-0 text-xs text-subtle">How it works</p>
					<h2 class="sec-title">A slower way to sit with what you feel.</h2>
				</div>
				<ol class="steps m-0 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-8">
					{#each steps as s, i (s.title)}
						<li class="flex flex-col gap-4">
							<span class="flex items-center gap-3">
								<span class="num">{i + 1}</span>
								<span class="h-px flex-1 bg-line-strong" aria-hidden="true"></span>
								<span class="text-mocha" aria-hidden="true"><Icon name={s.icon} size={20} /></span>
							</span>
							<h3 class="m-0 font-serif text-[24px] leading-[1.25] font-normal text-ink">{s.title}</h3>
							<p class="m-0 text-[15px] leading-[1.7] text-muted">{s.text}</p>
						</li>
					{/each}
				</ol>
			</div>
		</section>

		<!-- Privacy & safety -->
		<section id="privacy" class="wrap py-20 lg:py-28">
			<div class="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
				<div class="flex flex-col gap-5">
					<p class="eyebrow m-0 text-xs text-subtle">Privacy &amp; safety</p>
					<h2 class="sec-title">What you write here is yours.</h2>
					<p class="m-0 text-base leading-[1.75] text-muted">
						Privacy isn’t a setting you have to find. It’s how the space is built. Private writing is protected by the
						database itself, and anything shared is stripped of who wrote it.
					</p>
					<ul id="guidelines" class="m-0 flex list-none flex-col gap-2.5 border-l-2 border-[var(--color-dusty)] p-0 pl-5 text-[15px] leading-relaxed text-body">
						<li>Be gentle. Everyone here is carrying something.</li>
						<li>Anonymous means anonymous. Don’t guess, don’t ask.</li>
						<li>If you’re in danger, please contact local emergency services.</li>
					</ul>
				</div>
				<ul class="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
					{#each promises as p (p.title)}
						<li class="promise">
							<span class="picon" aria-hidden="true"><Icon name={p.icon} size={18} /></span>
							<strong class="text-[15px] font-semibold text-ink">{p.title}</strong>
							<span class="text-sm leading-[1.6] text-muted">{p.text}</span>
						</li>
					{/each}
				</ul>
			</div>
		</section>

		<!-- Final call to action -->
		<section class="wrap pb-20 lg:pb-28">
			<div class="cta">
				<h2 class="m-0 font-serif text-[clamp(34px,4.6vw,58px)] leading-[1.06] font-light tracking-[-0.025em] text-balance">
					Write the first line.<br /><em class="text-[var(--color-dusty)]">The rest will follow.</em>
				</h2>
				<p class="m-0 max-w-[460px] text-base leading-[1.7] text-[var(--band-text)]">It takes a moment to begin, and nothing you write is shared unless you choose.</p>
				<div class="flex flex-wrap justify-center gap-3">
					<a class="btn btn-lg cta-btn" href="/auth/signup">Create an account</a>
					<a class="btn btn-lg cta-ghost" href="/auth/login">I already have one</a>
				</div>
			</div>
		</section>
	</main>

	<footer class="border-t border-line bg-sand">
		<div class="wrap flex flex-col gap-10 pt-14 pb-10">
			<div class="flex flex-wrap justify-between gap-10">
				<div class="flex max-w-[320px] flex-col gap-3">
					<Wordmark size={22} />
					<span class="text-sm leading-[1.6] text-muted">A quiet space for reading, reflecting and writing what you couldn’t say out loud.</span>
				</div>
				<div class="flex flex-wrap gap-12">
					<nav aria-label="Explore" class="flex flex-col items-start gap-1">
						<span class="fhead">Explore</span>
						<a class="navlink inline-flex" href="#about">About</a>
						<a class="navlink inline-flex" href="#features">Features</a>
						<a class="navlink inline-flex" href="#privacy">Privacy &amp; safety</a>
						<a class="navlink inline-flex" href="#guidelines">Community guidelines</a>
					</nav>
					<nav aria-label="Account" class="flex flex-col items-start gap-1">
						<span class="fhead">Account</span>
						<a class="navlink inline-flex" href="/auth/signup">Create an account</a>
						<a class="navlink inline-flex" href="/auth/login">Sign in</a>
						<a class="navlink inline-flex" href="/auth/forgot">Forgot password</a>
					</nav>
				</div>
			</div>
			<div class="flex flex-wrap justify-between gap-4 border-t border-line-strong pt-6 text-[13px] text-subtle">
				<span>© 2026 Between the Lines. Journals and letters are private; community posts are anonymous.</span>
				<span class="font-serif text-[15px] italic">Made for the things we carry quietly.</span>
			</div>
		</div>
	</footer>
</div>

<style>
	.wrap {
		width: 100%;
		max-width: 1200px;
		margin-inline: auto;
		padding-inline: 20px;
	}
	@media (min-width: 640px) {
		.wrap {
			padding-inline: 32px;
		}
	}
	.skip {
		position: absolute;
		left: 12px;
		top: -60px;
		z-index: 60;
		padding: 10px 14px;
		background: var(--color-espresso);
		color: var(--color-cream);
	}
	.skip:focus {
		top: 12px;
	}
	.top {
		position: sticky;
		top: 0;
		z-index: 40;
		background: color-mix(in srgb, var(--color-paper) 88%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--color-line);
	}
	.navlink {
		align-items: center;
		min-height: 36px;
		color: var(--color-body);
		font-size: 14px;
		transition: color var(--t2);
	}
	.navlink:hover {
		color: var(--color-rose);
	}
	.hero {
		display: grid;
		align-items: center;
		gap: 56px;
		padding-top: 56px;
		padding-bottom: 80px;
	}
	@media (min-width: 960px) {
		.hero {
			grid-template-columns: 1.05fr 0.95fr;
			gap: 72px;
			padding-top: 96px;
			padding-bottom: 112px;
		}
	}
	.paper-back {
		position: absolute;
		inset: 16px -12px -16px 12px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-xs);
		background: var(--color-beige);
	}
	.glow {
		position: absolute;
		inset: -30% -10% auto auto;
		width: 720px;
		height: 720px;
		border-radius: 50%;
		background: radial-gradient(circle, color-mix(in srgb, var(--color-dusty) 30%, transparent), transparent 68%);
		filter: blur(30px);
		pointer-events: none;
	}
	.fade {
		animation: pageIn var(--t4) var(--ease-out) both;
	}
	.fade2 {
		animation: pageIn var(--t4) var(--ease-out) 0.15s both;
	}
	.arr {
		display: inline-flex;
		transition: transform var(--t2) var(--ease-out);
	}
	a:hover .arr {
		transform: translateX(3px);
	}
	.sec-title {
		margin: 0;
		font: 300 clamp(30px, 3.6vw, 46px) / 1.12 var(--font-serif);
		letter-spacing: -0.02em;
		color: var(--color-ink);
		text-wrap: balance;
	}
	/* Dark editorial band (Purpose, CTA): stays deep brown in both themes. */
	.band,
	.cta {
		--band-text: #e2d6ca;
		background: #3b2d27;
		color: #f7f2ea;
	}
	.feature {
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 28px 24px 24px;
		background: var(--color-card);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-xs);
		transition:
			transform var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out),
			border-color var(--t3) var(--ease-out);
	}
	.feature:hover {
		transform: translateY(-3px);
		border-color: var(--color-dusty);
		box-shadow: var(--shadow-raised);
	}
	.ficon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 46px;
		height: 46px;
		border-radius: 50%;
		background: var(--color-rose-tint);
		color: var(--color-rose);
		transition: background-color var(--t3) var(--ease-out), color var(--t3) var(--ease-out);
	}
	.feature:hover .ficon {
		background: var(--color-espresso);
		color: var(--color-cream);
	}
	.ftag {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		align-self: flex-start;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--color-beige);
		color: var(--color-body);
		font-size: 12px;
		font-weight: 500;
	}
	.num {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: 1px solid var(--color-dusty);
		color: var(--color-rose);
		font: italic 400 18px/1 var(--font-serif);
	}
	.promise {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 22px;
		background: var(--color-card);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-xs);
	}
	.picon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		margin-bottom: 4px;
		border-radius: 50%;
		background: var(--color-espresso);
		color: var(--color-cream);
	}
	.cta {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		padding: 64px 24px;
		border-radius: var(--radius-float);
		text-align: center;
	}
	@media (min-width: 640px) {
		.cta {
			padding: 88px 48px;
		}
	}
	.cta-btn {
		background: #f7f2ea;
		color: #3b2d27;
	}
	.cta-btn:hover {
		background: #eae0d3;
		color: #3b2d27;
	}
	.cta-ghost {
		border-color: rgb(247 242 234 / 0.35);
		color: #f7f2ea;
	}
	.cta-ghost:hover {
		border-color: #c9a89b;
		color: #f7f2ea;
	}
	.cta-btn:focus-visible,
	.cta-ghost:focus-visible {
		outline: 2px solid #c9a89b;
		outline-offset: 2px;
	}
	.fhead {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-subtle);
	}
	@media (prefers-reduced-motion: reduce) {
		.feature:hover {
			transform: none;
		}
	}
</style>
