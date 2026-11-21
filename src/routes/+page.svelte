<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import { excerpt, roman } from '#lib/poem.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// One evocative line per category, from the design.
	const lines: Record<string, string> = {
		love: 'For the ones who stayed.',
		heartbreak: 'For what broke open.',
		relationships: 'For the in-between of two people.',
		longing: 'For what is far, or gone.',
		healing: 'For the slow mending.',
		'self-love': 'For learning to stay with yourself.',
		growth: 'For who you are becoming.',
		life: 'For ordinary, astonishing days.',
		friendship: 'For the ones who know your silences.',
		'letting-go': 'For doors that have finished being doors.'
	};

	// Illustrative examples of what an anonymous reflection looks like (not live posts).
	const examples = [
		{ poem: 'The Kettle Still Remembers', text: 'I moved apartments so I wouldn’t see his side of the bed. I still bought two toothbrushes the first week. This poem made me laugh and cry at the same time.' },
		{ poem: 'Unsent', text: 'My drawer is a notes app. Forty-one drafts to my father. I think I’ll keep them there — not every letter is meant to be delivered.' },
		{ poem: 'Inventory', text: 'Tried this tonight: made a list of what stayed. My sister. Sunday rice. The plant I keep forgetting to water that refuses to die. Longer than I thought.' }
	];
</script>

<svelte:head>
	<title>Between the Lines — a quiet place for what goes unsaid</title>
</svelte:head>

<div class="page-in min-h-screen bg-paper">
	<!-- Top navigation -->
	<header class="border-b border-line">
		<nav aria-label="Main" class="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
			<Wordmark size={26} />
			<div class="flex flex-wrap items-center gap-5 sm:gap-7">
				<a class="navlink hidden sm:inline" href="/library">Poems</a>
				<a class="navlink hidden sm:inline" href="/community">Community</a>
				<a class="navlink hidden md:inline" href="#about">About</a>
				<a class="navlink hidden md:inline" href="#guidelines">Guidelines</a>
				<a class="navlink" href="/auth/login">Sign in</a>
				<a class="btn btn-primary" href="/auth/signup">Start writing</a>
			</div>
		</nav>
	</header>

	<!-- Hero -->
	<div class="relative overflow-hidden">
		<div class="drift drift-a" aria-hidden="true"></div>
		<div class="drift drift-b" aria-hidden="true"></div>
		<div class="grain" aria-hidden="true"></div>
		<section class="relative mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(460px,100%),1fr))] items-center gap-16 px-5 pt-16 pb-24 sm:px-8 lg:gap-[72px] lg:pt-24 lg:pb-28">
			<div class="fade flex flex-col gap-8">
				<p class="eyebrow m-0 text-xs text-subtle">A quiet place for what goes unsaid</p>
				<h1 class="m-0 font-serif text-[clamp(40px,5.4vw,72px)] leading-[1.04] font-light tracking-[-0.025em] text-balance text-ink">
					Some feelings are difficult to explain. <em class="text-rose">Here, you don’t have to.</em>
				</h1>
				<p class="m-0 max-w-[500px] text-lg leading-[1.65] text-muted">
					Read short poems about love, loss and becoming. Then write what they stirred in you — kept privately in your
					journal, or shared anonymously with people who understand.
				</p>
				<div class="flex flex-wrap gap-3">
					<a class="btn btn-primary" href="/auth/signup">Just write <span class="arr"><Icon name="arrow" size={18} /></span></a>
					<a class="btn btn-ghost" href="/library">Explore poems</a>
				</div>
				<p class="m-0 flex items-center gap-2 text-[13px] text-subtle">
					<Icon name="lock" size={16} />Every reflection is private. Sharing is always a separate, anonymous step.
				</p>
			</div>

			{#if data.poem}
				<!-- Featured poem, set like a page -->
				<figure class="fade2 relative m-0">
					<div aria-hidden="true" class="absolute inset-[18px_-14px_-18px_14px] border border-line bg-[#EFE6D9]"></div>
					<div class="relative border border-line bg-sheet px-7 pt-10 pb-8 shadow-[0_30px_60px_-40px_rgba(63,50,43,.5)] sm:px-14 sm:pt-14 sm:pb-11">
						<div class="mb-9 flex items-center justify-between">
							<span class="eyebrow text-rose">Poem of the day{data.poem.category ? ` · ${data.poem.category.name}` : ''}</span>
						</div>
						<h2 class="m-0 mb-7 font-serif text-[30px] font-normal tracking-[-0.01em] text-ink sm:text-[34px]">{data.poem.title}</h2>
						<blockquote class="m-0 font-serif text-[19px] leading-[1.7] whitespace-pre-line text-ink-3 sm:text-[21px]">{excerpt(data.poem.body)}</blockquote>
						<div class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-6">
							<cite class="text-sm text-muted not-italic">— {data.poem.author}</cite>
							<a href="/read/{data.poem.slug}" class="inline-flex items-center gap-1.5 text-sm font-medium">Read &amp; reflect <span class="arr"><Icon name="arrow" size={16} /></span></a>
						</div>
					</div>
				</figure>
			{/if}
		</section>
	</div>

	<!-- Philosophy band -->
	<section id="about" class="bg-espresso text-cream-2">
		<div class="mx-auto flex max-w-[920px] flex-col items-center gap-7 px-5 py-20 text-center sm:px-8 sm:py-[104px]">
			<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D9B3AE" stroke-width="1.2" aria-hidden="true"><path d="M4 7h16v10H4z" /><path d="m4 7 8 6 8-6" /></svg>
			<p class="m-0 font-serif text-[clamp(28px,3.4vw,44px)] leading-[1.3] font-light tracking-[-0.01em] text-balance italic">
				“Some feelings are difficult to explain. Here, you don’t have to. Just write.”
			</p>
			<p class="eyebrow m-0 text-xs text-[#CDBFB0]">Our only philosophy</p>
		</div>
	</section>

	<!-- How it works -->
	<section class="mx-auto max-w-[1240px] px-5 pt-24 pb-20 sm:px-8 lg:pt-[120px] lg:pb-24">
		<div class="mb-16 flex flex-wrap items-end justify-between gap-6">
			<h2 class="m-0 max-w-[560px] font-serif text-[clamp(32px,3.6vw,48px)] leading-[1.1] font-light tracking-[-0.02em] text-ink">A slower way to sit with what you feel.</h2>
			<p class="m-0 max-w-[380px] text-base leading-[1.65] text-muted">No feeds to keep up with, no follower counts, no names. Just words, and the space to answer them.</p>
		</div>
		<div class="steps grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] border-t border-[#D8CCBD]">
			{#each [
				['Read slowly', 'Original poems and short pieces, set for unhurried reading. One a day, or as many as you need.'],
				['Write what it means', 'Gentle prompts help you begin. A memory, a single line, a whole letter — there is no wrong way to answer.'],
				['Keep it, or share it anonymously', 'Reflections live in your private journal. If you want to, you can write a separate anonymous post for the community.']
			] as [title, text], i (title)}
				<div class="step flex flex-col gap-4 py-10">
					<span class="font-serif text-xl text-rose italic">{roman(i)}.</span>
					<h3 class="m-0 font-serif text-[26px] font-normal text-ink">{title}</h3>
					<p class="m-0 text-[15px] leading-[1.7] text-muted">{text}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- Categories -->
	<section class="border-y border-line bg-sand">
		<div class="mx-auto max-w-[1240px] px-5 py-20 sm:px-8 lg:py-[104px]">
			<div class="mb-12 flex flex-wrap items-end justify-between gap-6">
				<div class="flex flex-col gap-3.5">
					<p class="eyebrow m-0 text-xs text-subtle">The library</p>
					<h2 class="m-0 font-serif text-[clamp(32px,3.6vw,48px)] font-light tracking-[-0.02em] text-ink">Find the words for where you are.</h2>
				</div>
				<a href="/library" class="text-[15px] font-medium">Browse all poems →</a>
			</div>
			<div class="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
				{#each data.categories as c, i (c.id)}
					<a class="card cat flex min-h-[168px] flex-col justify-between gap-10 rounded-xs border border-line bg-card p-6 text-ink-2 hover:text-ink-2" href="/library?category={c.slug}">
						<span class="font-serif text-sm text-rose italic">{roman(i)}.</span>
						<span class="flex flex-col gap-1.5">
							<span class="flex items-baseline justify-between"><span class="font-serif text-[26px] text-ink">{c.name}</span><span class="cat-arrow text-[#A39486]">→</span></span>
							<span class="text-[13px] leading-normal text-subtle">{lines[c.slug] ?? c.description}</span>
						</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- Community reflections (illustrative) -->
	<section class="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 lg:py-[120px]">
		<div class="mb-14 flex max-w-[640px] flex-col gap-3.5">
			<p class="eyebrow m-0 text-xs text-subtle">The anonymous community</p>
			<h2 class="m-0 font-serif text-[clamp(32px,3.6vw,48px)] leading-[1.1] font-light tracking-[-0.02em] text-ink">What readers find in the same lines.</h2>
			<p class="m-0 text-[15px] leading-relaxed text-muted">Examples of the kind of reflections people share. In the community, every post is anonymous — no names, no photos, no profiles.</p>
		</div>
		<div class="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-6">
			{#each examples as r (r.poem)}
				<article class="card card-q flex flex-col gap-6 rounded-xs border border-line bg-card p-8">
					<p class="m-0 text-xs text-subtle">On <em class="font-serif text-sm text-rose">{r.poem}</em></p>
					<p class="m-0 flex-1 font-serif text-[19px] leading-[1.6] text-ink-3">{r.text}</p>
					<div class="flex items-center justify-between border-t border-line-soft pt-5">
						<span class="flex items-center gap-2.5 text-[13px] text-body">
							<span class="inline-flex size-[30px] items-center justify-center rounded-full bg-[#8B7B6B] text-cream" aria-hidden="true"><Icon name="community" size={15} /></span>Anonymous
						</span>
						<span class="text-xs text-subtle italic">Example</span>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<!-- Privacy -->
	<section id="guidelines" class="mx-auto max-w-[1240px] px-5 pb-24 sm:px-8 lg:pb-[120px]">
		<div id="privacy" class="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] border border-[#D8CCBD] bg-card">
			<div class="flex flex-col gap-5 border-line p-8 sm:p-14 lg:border-r">
				<h2 class="m-0 font-serif text-[40px] leading-[1.1] font-light tracking-[-0.02em] text-ink">Your journal is yours.</h2>
				<p class="m-0 text-base leading-[1.7] text-muted">
					Journal entries are never shown to anyone — not other readers, not moderators. Nothing you write in your journal is
					ever published automatically. If you want to share, you write a separate anonymous post, on purpose.
				</p>
				<ul class="m-0 flex list-none flex-col gap-2 p-0 text-[15px] leading-relaxed text-body">
					<li>— Be gentle. Everyone here is carrying something.</li>
					<li>— Anonymous means anonymous. Don’t guess, don’t ask.</li>
					<li>— If you’re in danger, please contact local emergency services.</li>
				</ul>
			</div>
			<div class="flex flex-col justify-center gap-4 p-8 sm:p-14">
				<div class="flex items-start gap-4 border border-espresso bg-paper p-5">
					<span class="inline-flex size-10 flex-none items-center justify-center rounded-full bg-espresso text-cream"><Icon name="lock" size={18} /></span>
					<span class="flex flex-col gap-1"><strong class="text-[15px] font-semibold text-ink">Private · only you</strong><span class="text-sm leading-[1.55] text-muted">Every journal entry. Always. Lives only in My Journal.</span></span>
				</div>
				<div class="flex items-start gap-4 border border-line p-5">
					<span class="inline-flex size-10 flex-none items-center justify-center rounded-full bg-[#EAE3D9] text-body">
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3 3.4M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a8.8 8.8 0 0 0 3.4-.7" /></svg>
					</span>
					<span class="flex flex-col gap-1"><strong class="text-[15px] font-semibold text-ink">Community · anonymous</strong><span class="text-sm leading-[1.55] text-muted">A separate post you choose to write. No name, photo or profile — ever.</span></span>
				</div>
				<div class="flex items-start gap-4 border border-line p-5">
					<span class="inline-flex size-10 flex-none items-center justify-center rounded-full bg-rose-tint text-rose"><Icon name="shield" size={18} /></span>
					<span class="flex flex-col gap-1"><strong class="text-[15px] font-semibold text-ink">No public profiles</strong><span class="text-sm leading-[1.55] text-muted">Your account page is visible to you alone.</span></span>
				</div>
			</div>
		</div>
	</section>

	<!-- Closing CTA -->
	<section class="border-t border-line">
		<div class="mx-auto flex max-w-[820px] flex-col items-center gap-8 px-5 py-24 text-center sm:px-8 lg:py-[120px]">
			<h2 class="m-0 font-serif text-[clamp(40px,5vw,64px)] leading-[1.05] font-light tracking-[-0.025em] text-ink">
				Write the first line.<br /><em class="text-rose">The rest will follow.</em>
			</h2>
			<a class="btn btn-primary" href="/auth/signup">Start writing — it’s free</a>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-line bg-skel">
		<div class="mx-auto flex max-w-[1240px] flex-col gap-10 px-5 pt-14 pb-10 sm:px-8">
			<div class="flex flex-wrap justify-between gap-8">
				<div class="flex max-w-[320px] flex-col gap-3">
					<Wordmark size={24} />
					<span class="text-sm leading-[1.6] text-muted">A quiet space for reading, reflecting and writing what you couldn’t say out loud.</span>
				</div>
				<nav aria-label="Footer" class="flex flex-wrap items-start gap-8">
					<a class="navlink" href="#about">About</a>
					<a class="navlink" href="#privacy">Privacy</a>
					<a class="navlink" href="#guidelines">Guidelines</a>
				</nav>
			</div>
			<div class="flex flex-wrap justify-between gap-4 border-t border-line-strong pt-6 text-[13px] text-subtle">
				<span>© 2026 Between the Lines</span>
				<span class="font-serif text-[15px] italic">Made for the things we carry quietly.</span>
			</div>
		</div>
	</footer>
</div>

<style>
	.navlink {
		color: var(--color-body);
		font-size: 14px;
		transition: color var(--t2);
	}
	.navlink:hover {
		color: var(--color-rose);
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
	.cat-arrow {
		transition:
			transform var(--t3) var(--ease-out),
			color var(--t3) var(--ease-out);
	}
	.cat:hover .cat-arrow {
		transform: translateX(4px);
		color: var(--color-rose);
	}
	.card-q {
		position: relative;
	}
	.card-q::after {
		content: '';
		position: absolute;
		left: 32px;
		right: 32px;
		bottom: -1px;
		height: 1px;
		background: #a45a5e;
		transform: scaleX(0);
		transform-origin: left;
		transition: transform var(--t4) var(--ease-out);
	}
	.card-q:hover::after {
		transform: scaleX(1);
	}
	/* How-it-works dividers on wide screens */
	@media (min-width: 960px) {
		.step {
			padding-left: 40px;
			padding-right: 40px;
			border-right: 1px solid var(--color-line);
		}
		.step:first-child {
			padding-left: 0;
		}
		.step:last-child {
			padding-right: 0;
			border-right: 0;
		}
	}
	/* Hero: slow drifting light + paper grain, purely decorative */
	.drift {
		position: absolute;
		border-radius: 50%;
		filter: blur(40px);
		pointer-events: none;
		will-change: transform;
	}
	.drift-a {
		width: 560px;
		height: 560px;
		left: -140px;
		top: -180px;
		background: radial-gradient(circle, rgba(217, 179, 174, 0.3), rgba(217, 179, 174, 0) 68%);
		animation: driftA 42s var(--ease-io) infinite alternate;
	}
	.drift-b {
		width: 680px;
		height: 680px;
		right: -200px;
		bottom: -300px;
		background: radial-gradient(circle, rgba(203, 184, 160, 0.32), rgba(203, 184, 160, 0) 68%);
		animation: driftB 36s var(--ease-io) infinite alternate;
	}
	@keyframes driftA {
		to {
			transform: translate(110px, 70px) scale(1.08);
		}
	}
	@keyframes driftB {
		to {
			transform: translate(-90px, -60px) scale(1.05);
		}
	}
	.grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.5;
		background-image: radial-gradient(rgba(63, 50, 43, 0.05) 1px, transparent 1px);
		background-size: 3px 3px;
	}
	@media (prefers-reduced-motion: reduce) {
		.drift {
			animation: none !important;
		}
	}
</style>
