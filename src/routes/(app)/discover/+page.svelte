<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PoemCard from '#lib/components/PoemCard.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import type { IconName } from '#lib/icons.ts';
	import { stanzas } from '#lib/poem.ts';
	import { ago, greeting } from '#lib/time.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Time-of-day greeting uses the reader's clock, so it is set in the browser.
	let hello = $state('Welcome back');
	let today = $state('');
	onMount(() => {
		hello = greeting();
		today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
	});

	const firstName = $derived(data.displayName.split(' ')[0]);
	const potd = $derived(data.poemOfDay);

	const actions: { href: string; icon: IconName; title: string; text: string; tag?: string }[] = [
		{ href: '/write', icon: 'pen', title: 'Write in your journal', text: 'A reflection in your own words.', tag: 'Private' },
		{ href: '/letters/write?kind=present', icon: 'envelope', title: 'Write a letter', text: 'To who you were, are, or will be.', tag: 'Private' },
		{ href: '/library', icon: 'library', title: 'Explore poetry', text: 'Find words for where you are.' },
		{ href: '/community/new', icon: 'community', title: 'Share anonymously', text: 'A separate post, no name attached.' }
	];

	// One evocative line per feeling.
	const moodLines: Record<string, string> = {
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
</script>

<svelte:head><title>Discover — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-12 md:gap-16">
	<!-- Greeting -->
	<section class="fade flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
		<div class="flex max-w-[620px] min-w-0 flex-col gap-3">
			<p class="eyebrow m-0 min-h-4 text-xs text-subtle">{today}</p>
			<h1 class="page-title">{hello}, <em>{firstName}.</em></h1>
			<p class="page-lede">Read something slowly. Write if you want to. There’s no wrong way to be here.</p>
		</div>
		<form action="/library" class="w-full sm:w-[340px]" role="search">
			<SearchField label="Search poems" placeholder="Search a poem, a feeling, a line…" />
		</form>
	</section>

	{#if data.draft}
		<a href="/write?id={data.draft.id}" class="draft-note -mt-6 md:-mt-8">
			<span class="inline-flex size-8 flex-none items-center justify-center rounded-full bg-rose-tint text-rose"><Icon name="pen" size={15} /></span>
			<span class="min-w-0 flex-1 truncate">A draft is waiting{data.draft.title ? `: “${data.draft.title}”` : ''}</span>
			<span class="flex-none font-medium text-rose">Continue <span aria-hidden="true">→</span></span>
		</a>
	{/if}

	{#if potd}
		<!-- Poem of the day: the page's focal point -->
		<section aria-labelledby="potd-title" class="potd fade2">
			<div class="flex flex-col gap-5 p-7 sm:p-10 lg:p-12">
				<span class="eyebrow text-rose">Poem of the day · {potd.category}</span>
				<h2 id="potd-title" class="m-0 font-serif text-[30px] leading-tight font-normal tracking-[-0.01em] text-ink sm:text-[38px]">{potd.title}</h2>
				<p class="m-0 max-w-[34ch] font-serif text-[19px] leading-[1.75] whitespace-pre-line text-ink-3 sm:text-[21px]">{stanzas(potd.body)[0]?.join('\n')}</p>
				<span class="text-sm text-muted">by {potd.author}</span>
			</div>
			<div class="potd-side">
				<div class="flex flex-col gap-3">
					<span class="eyebrow text-subtle">Today’s question</span>
					<p class="m-0 font-serif text-[23px] leading-[1.4] font-light text-ink italic sm:text-[26px]">
						{potd.prompts[0] ?? 'What did these words stir in you?'}
					</p>
				</div>
				<div class="flex flex-wrap gap-2.5">
					<a class="btn btn-primary" href="/read/{potd.slug}">Read the poem</a>
					<a class="btn btn-ghost" href="/write?poem={potd.slug}"><Icon name="pen" size={16} />Write about it</a>
				</div>
			</div>
		</section>
	{/if}

	<!-- Quick actions -->
	<section aria-labelledby="qa-title" class="flex flex-col gap-4">
		<h2 id="qa-title" class="section-title">Where would you like to begin?</h2>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each actions as a, i (a.href)}
				<a href={a.href} class="surface qa rise flex items-start gap-4 p-5" style="animation-delay: {i * 60}ms">
					<span class="qa-ico"><Icon name={a.icon} size={19} /></span>
					<span class="flex min-w-0 flex-1 flex-col gap-1">
						<span class="font-serif text-[19px] leading-tight text-ink">{a.title}</span>
						<span class="text-[13px] leading-snug text-muted">{a.text}</span>
						{#if a.tag}<span class="mt-1.5 inline-flex items-center gap-1 text-xs text-subtle"><Icon name="lock" size={12} />{a.tag}</span>{/if}
					</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- Mood → category -->
	<section aria-labelledby="mood-title" class="flex flex-col gap-4">
		<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
			<div class="flex flex-col gap-1">
				<h2 id="mood-title" class="section-title">What are you carrying today?</h2>
				<p class="m-0 text-sm text-muted">Pick a feeling and we’ll find words for it.</p>
			</div>
			<a href="/library" class="section-link">Browse the library</a>
		</div>
		<ul class="moods m-0 list-none p-0">
			{#each data.categories as c (c.id)}
				<li>
					<a class="mood" href="/library?category={c.slug}">
						<span class="font-serif text-[19px] leading-tight text-ink">{c.name}</span>
						<span class="text-[12.5px] leading-snug text-subtle">{moodLines[c.slug] ?? ''}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Primary + secondary columns -->
	<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
		<div class="flex min-w-0 flex-col gap-12">
			{#if data.featured.length}
				<section aria-labelledby="feat-title" class="flex flex-col gap-5">
					<div class="flex items-baseline justify-between gap-4">
						<h2 id="feat-title" class="section-title">Featured this week</h2>
						<a href="/library" class="section-link">See all</a>
					</div>
					<div class="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-4">
						{#each data.featured as p, i (p.id)}<PoemCard poem={p} delay={i * 80} />{/each}
					</div>
				</section>
			{/if}

			<section aria-labelledby="recs-title" class="flex flex-col gap-5">
				<div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
					<div class="flex flex-col gap-1">
						<h2 id="recs-title" class="section-title">From the community</h2>
						<span class="flex items-center gap-1.5 text-sm text-subtle"><Icon name="community" size={14} />Shared anonymously by other readers</span>
					</div>
					<a href="/community" class="section-link">Visit the community</a>
				</div>
				{#if data.highlight}
					<article class="highlight flex flex-col gap-3.5 p-6 sm:p-8">
						<span class="eyebrow text-[#c9a89b]">Most felt this week</span>
						<p class="m-0 line-clamp-5 font-serif text-[19px] leading-[1.6]">“{data.highlight.body}”</p>
						<span class="text-[13px] text-[#d6c7b9]">Anonymous · {data.highlight.likes_count} {data.highlight.likes_count === 1 ? 'person' : 'people'} felt this</span>
					</article>
				{/if}
				{#each data.recs.filter((r) => r.id !== data.highlight?.id) as r (r.id)}
					<article class="surface flex flex-col gap-4 p-6 sm:p-7">
						{#if r.poem_title}<span class="text-xs text-subtle">On <a href="/read/{r.poem_slug}" class="font-serif text-sm italic">{r.poem_title}</a></span>{/if}
						<p class="m-0 line-clamp-5 font-serif text-lg leading-[1.6] whitespace-pre-line text-ink-3">{r.body}</p>
						<div class="flex items-center justify-between gap-3 border-t border-line-soft pt-3.5 text-[13px] text-subtle">
							<span>Anonymous · {ago(r.created_at)}</span>
							<span class="flex items-center gap-1.5"><Icon name="heart" size={15} /><span class="sr-only">Felt by</span>{r.likes_count}</span>
						</div>
					</article>
				{:else}
					{#if !data.highlight}
						<p class="surface m-0 p-6 text-sm leading-relaxed text-muted">It’s quiet here today. When readers share anonymously, their words will appear here.</p>
					{/if}
				{/each}
			</section>
		</div>

		<!-- Secondary column -->
		<aside class="flex min-w-0 flex-col gap-6" aria-label="Your space">
			<section class="surface flex flex-col p-5" aria-labelledby="mine-title">
				<div class="mb-2 flex items-center justify-between gap-3">
					<h2 id="mine-title" class="m-0 font-serif text-xl font-normal text-ink">Your recent writing</h2>
					<span class="privacy-tag"><Icon name="lock" size={12} />Only you</span>
				</div>
				{#each data.activity as a (a.kind + a.id)}
					<a href={a.href} class="row flex items-center gap-3 border-t border-line-soft py-3 text-ink-2 hover:text-ink-2">
						<span class="text-mocha"><Icon name={a.kind === 'letter' ? 'envelope' : 'journal'} size={16} /></span>
						<span class="flex min-w-0 flex-1 flex-col">
							<span class="row-t truncate font-serif text-[17px]">{a.title}</span>
							<span class="text-xs text-subtle">{a.kind === 'letter' ? 'Letter' : 'Journal'}{a.draft ? ' · draft' : ''} · {ago(a.at)}</span>
						</span>
					</a>
				{:else}
					<div class="flex flex-col gap-3 border-t border-line-soft pt-3">
						<p class="m-0 text-sm leading-relaxed text-muted">Nothing yet. Your first entry will wait for you here, and only here.</p>
						<a href="/write" class="text-sm font-medium">Write your first entry →</a>
					</div>
				{/each}
				{#if data.activity.length}
					<div class="flex gap-4 border-t border-line-soft pt-3 text-[13px] font-medium">
						<a href="/journal">My journal</a><a href="/letters">My letters</a>
					</div>
				{/if}
			</section>

			<section class="surface flex flex-col p-5" aria-labelledby="saved-title">
				<div class="mb-2 flex items-center justify-between gap-3">
					<h2 id="saved-title" class="m-0 font-serif text-xl font-normal text-ink">Saved for later</h2>
					{#if data.saved.length}<a href="/bookmarks" class="text-[13px] font-medium">See all</a>{/if}
				</div>
				{#each data.saved as p (p.id)}
					<a href="/read/{p.slug}" class="row flex flex-col border-t border-line-soft py-3 text-ink-2 hover:text-ink-2">
						<span class="row-t font-serif text-[17px]">{p.title}</span>
						<span class="text-xs text-subtle">{p.author} · {p.category}</span>
					</a>
				{:else}
					<p class="m-0 flex items-center gap-2 border-t border-line-soft pt-3 text-sm leading-relaxed text-muted">
						<Icon name="bookmark" size={16} />Tap the ribbon on any poem to keep it close.
					</p>
				{/each}
			</section>

			{#if data.recent.length}
				<section class="flex flex-col" aria-labelledby="new-title">
					<h2 id="new-title" class="m-0 mb-2 font-serif text-xl font-normal text-ink">Recently added</h2>
					{#each data.recent as p (p.id)}
						<a class="row flex items-baseline justify-between gap-3 border-b border-line py-3 text-ink-2 hover:text-ink-2" href="/read/{p.slug}">
							<span class="flex min-w-0 flex-col gap-0.5"><span class="row-t font-serif text-[17px]">{p.title}</span><span class="text-xs text-subtle">{p.author}</span></span>
							<span class="flex-none text-xs text-subtle">{ago(p.created_at)}</span>
						</a>
					{/each}
				</section>
			{/if}
		</aside>
	</div>
</div>

<style>
	.fade {
		animation: pageIn var(--t4) var(--ease-out) both;
	}
	.fade2 {
		animation: pageIn var(--t4) var(--ease-out) 0.12s both;
	}
	.draft-note {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border: 1px solid var(--color-rose-soft);
		border-radius: var(--radius-xs);
		background: var(--color-rose-tint);
		font-size: 14px;
		color: var(--color-ink-2);
		transition: border-color var(--t2) var(--ease-out);
	}
	.draft-note:hover {
		color: var(--color-ink-2);
		border-color: var(--color-rose);
	}
	.potd {
		display: grid;
		overflow: hidden;
		background: var(--color-sheet);
		border: 1px solid var(--color-line);
		border-radius: var(--radius-xs);
		box-shadow: var(--shadow-raised);
	}
	@media (min-width: 900px) {
		.potd {
			grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
		}
	}
	.potd-side {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 28px;
		padding: 28px;
		background: var(--color-sand-2);
		border-top: 1px solid var(--color-line-soft);
	}
	@media (min-width: 640px) {
		.potd-side {
			padding: 40px;
		}
	}
	@media (min-width: 900px) {
		.potd-side {
			border-top: 0;
			border-left: 1px solid var(--color-line-soft);
		}
	}
	.qa-ico {
		flex: none;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-beige);
		color: var(--color-espresso);
		transition:
			background-color var(--t3) var(--ease-out),
			color var(--t3) var(--ease-out);
	}
	.qa:hover .qa-ico {
		background: var(--color-espresso);
		color: var(--color-cream);
	}
	/* Feelings: a swipeable row on phones, a grid from tablets up. */
	.moods {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 168px;
		gap: 10px;
		overflow-x: auto;
		margin: 0 -20px;
		padding: 2px 20px 6px;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
	}
	.moods::-webkit-scrollbar {
		display: none;
	}
	.moods li {
		scroll-snap-align: start;
	}
	@media (min-width: 640px) {
		.moods {
			grid-auto-flow: row;
			grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
			overflow: visible;
			margin: 0;
			padding: 0;
		}
	}
	.mood {
		display: flex;
		flex-direction: column;
		gap: 6px;
		height: 100%;
		min-height: 92px;
		padding: 16px 16px 14px;
		background: var(--color-card);
		border: 1px solid var(--color-line);
		border-left: 3px solid var(--color-dusty);
		border-radius: var(--radius-xs);
		transition:
			border-color var(--t2) var(--ease-out),
			background-color var(--t2) var(--ease-out),
			transform var(--t3) var(--ease-out);
	}
	.mood:hover {
		background: var(--color-sheet);
		border-color: var(--color-line-hover);
		border-left-color: var(--color-rose);
		transform: translateY(-2px);
	}
	.privacy-tag {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px 8px;
		border-radius: 999px;
		background: var(--color-beige);
		color: var(--color-body);
		font-size: 11px;
		font-weight: 500;
	}
	.row-t {
		transition: color var(--t2) var(--ease-out);
	}
	.row:hover .row-t {
		color: var(--color-rose);
	}
	.highlight {
		background: #3b2d27; /* deep brown in both themes */
		color: #f3ece2;
		border-radius: var(--radius-xs);
	}
	@media (prefers-reduced-motion: reduce) {
		.mood:hover {
			transform: none;
		}
	}
</style>
