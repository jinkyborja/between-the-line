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

	const actions: { href: string; icon: IconName; title: string; text: string }[] = [
		{ href: '/write', icon: 'pen', title: 'Write in your journal', text: 'A private reflection, in your own words.' },
		{ href: '/letters/write?kind=present', icon: 'envelope', title: 'Write a letter', text: 'To who you were, are, or are becoming.' },
		{ href: '/library', icon: 'library', title: 'Explore poetry', text: 'Find words for where you are.' }
	];
</script>

<svelte:head><title>Discover — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-12 md:gap-14">
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

	<!-- Quick actions -->
	<section aria-labelledby="qa-title" class="flex flex-col gap-4">
		<h2 id="qa-title" class="sr-only">Quick actions</h2>
		{#if data.draft}
			<a href="/write?id={data.draft.id}" class="draft-note">
				<span class="inline-flex size-8 flex-none items-center justify-center rounded-full bg-rose-tint text-rose"><Icon name="pen" size={15} /></span>
				<span class="min-w-0 flex-1 truncate">
					A draft is waiting{data.draft.title ? ` — “${data.draft.title}”` : ''}
				</span>
				<span class="flex-none font-medium text-rose">Continue →</span>
			</a>
		{/if}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{#each actions as a, i (a.href)}
				<a href={a.href} class="surface qa rise flex items-start gap-4 p-5" style="animation-delay: {i * 60}ms">
					<span class="qa-ico"><Icon name={a.icon} size={19} /></span>
					<span class="flex min-w-0 flex-col gap-1">
						<span class="font-serif text-[19px] leading-tight text-ink">{a.title}</span>
						<span class="text-[13px] leading-snug text-muted">{a.text}</span>
					</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- Mood → category -->
	<section aria-labelledby="mood-title" class="flex flex-col gap-4">
		<div class="flex items-baseline justify-between gap-4">
			<h2 id="mood-title" class="section-title">What are you carrying today?</h2>
			<a href="/library" class="section-link">All categories</a>
		</div>
		<div class="flex flex-wrap gap-2">
			{#each data.categories as c (c.id)}<a class="chip" href="/library?category={c.slug}">{c.name}</a>{/each}
		</div>
	</section>

	<!-- Primary + secondary columns -->
	<div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
		<div class="flex min-w-0 flex-col gap-12">
			{#if potd}
				<!-- Poem of the day -->
				<section aria-labelledby="potd-title" class="potd surface fade2 grid grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
					<div class="flex flex-col gap-5 p-7 sm:p-10">
						<span class="eyebrow text-rose">Poem of the day · {potd.category}</span>
						<h2 id="potd-title" class="m-0 font-serif text-[30px] leading-tight font-normal tracking-[-0.01em] text-ink sm:text-[34px]">{potd.title}</h2>
						<p class="m-0 font-serif text-[19px] leading-[1.7] whitespace-pre-line text-ink-3 sm:text-xl">{stanzas(potd.body)[0]?.join('\n')}</p>
						<span class="text-sm text-muted">— {potd.author}</span>
					</div>
					<div class="flex flex-col justify-between gap-7 border-t border-line-soft bg-sand-2 p-7 sm:p-10 md:border-t-0 md:border-l">
						<div class="flex flex-col gap-3">
							<span class="eyebrow text-subtle">Tonight’s question</span>
							<p class="m-0 font-serif text-[24px] leading-[1.35] font-light text-ink italic sm:text-[26px]">
								{potd.prompts[0] ?? 'What did these words stir in you?'}
							</p>
						</div>
						<div class="flex flex-wrap gap-2.5">
							<a class="btn btn-primary" href="/read/{potd.slug}">Read the poem</a>
							<a class="btn btn-ghost" href="/write?poem={potd.slug}">Write about it</a>
						</div>
					</div>
				</section>
			{/if}

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

			{#if data.recs.length}
				<section aria-labelledby="recs-title" class="flex flex-col gap-5">
					<div class="flex flex-col gap-1.5">
						<h2 id="recs-title" class="section-title">Reflections you might need</h2>
						<span class="text-sm text-subtle">Shared anonymously by other readers</span>
					</div>
					{#each data.recs as r (r.id)}
						<article class="surface flex flex-col gap-4 p-6 sm:p-7">
							{#if r.poem_title}<span class="text-xs text-subtle">On <a href="/read/{r.poem_slug}" class="font-serif text-sm italic">{r.poem_title}</a></span>{/if}
							<p class="m-0 line-clamp-5 font-serif text-lg leading-[1.6] whitespace-pre-line text-ink-3">{r.body}</p>
							<div class="flex items-center justify-between gap-3 border-t border-line-soft pt-3.5 text-[13px] text-subtle">
								<span>Anonymous · {ago(r.created_at)}</span>
								<span class="flex items-center gap-1.5"><Icon name="heart" size={15} />{r.likes_count}</span>
							</div>
						</article>
					{/each}
				</section>
			{/if}
		</div>

		<!-- Secondary column -->
		<aside class="flex min-w-0 flex-col gap-6" aria-label="Your space">
			<section class="surface flex flex-col gap-1 p-5" aria-labelledby="mine-title">
				<div class="mb-2 flex items-center justify-between gap-3">
					<h2 id="mine-title" class="m-0 font-serif text-xl font-normal text-ink">Your recent writing</h2>
					<span class="text-subtle"><Icon name="lock" size={14} label="Private — only you" /></span>
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
					<p class="m-0 border-t border-line-soft pt-3 text-sm leading-relaxed text-muted">Nothing yet. Your first entry will wait for you here — and only here.</p>
				{/each}
			</section>

			<section class="surface flex flex-col gap-1 p-5" aria-labelledby="saved-title">
				<div class="mb-2 flex items-center justify-between gap-3">
					<h2 id="saved-title" class="m-0 font-serif text-xl font-normal text-ink">Saved for later</h2>
					<a href="/bookmarks" class="text-[13px] font-medium">All</a>
				</div>
				{#each data.saved as p (p.id)}
					<a href="/read/{p.slug}" class="row flex flex-col border-t border-line-soft py-3 text-ink-2 hover:text-ink-2">
						<span class="row-t font-serif text-[17px]">{p.title}</span>
						<span class="text-xs text-subtle">{p.author} · {p.category}</span>
					</a>
				{:else}
					<p class="m-0 border-t border-line-soft pt-3 text-sm leading-relaxed text-muted">Tap the ribbon on any poem to keep it close.</p>
				{/each}
			</section>

			<section class="flex flex-col gap-1" aria-labelledby="new-title">
				<h2 id="new-title" class="m-0 mb-2 font-serif text-xl font-normal text-ink">Recently added</h2>
				{#each data.recent as p (p.id)}
					<a class="row flex items-baseline justify-between gap-3 border-b border-line py-3 text-ink-2 hover:text-ink-2" href="/read/{p.slug}">
						<span class="flex min-w-0 flex-col gap-0.5"><span class="row-t font-serif text-[17px]">{p.title}</span><span class="text-xs text-subtle">{p.author}</span></span>
						<span class="flex-none text-xs text-subtle">{ago(p.created_at)}</span>
					</a>
				{/each}
			</section>

			{#if data.highlight}
				<section class="highlight flex flex-col gap-3.5 p-6" aria-labelledby="hl-title">
					<h2 id="hl-title" class="eyebrow m-0 text-rose-soft">Community highlight</h2>
					<p class="m-0 line-clamp-5 font-serif text-lg leading-[1.55]">“{data.highlight.body}”</p>
					<span class="text-[13px] text-[#CDBFB0]">Anonymous · {data.highlight.likes_count} {data.highlight.likes_count === 1 ? 'person' : 'people'} felt this</span>
					<a href="/community" class="text-sm font-medium text-[#E8C9C4] hover:text-cream">Visit the community →</a>
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
		border-radius: 2px;
		background: var(--color-rose-tint);
		font-size: 14px;
		color: var(--color-ink-2);
		transition: border-color var(--t2) var(--ease-out);
	}
	.draft-note:hover {
		color: var(--color-ink-2);
		border-color: var(--color-rose);
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
	.row-t {
		transition: color var(--t2) var(--ease-out);
	}
	.row:hover .row-t {
		color: var(--color-rose);
	}
	.highlight {
		background: #3b2d27; /* deep brown in both themes */
		color: #f3ece2;
		border-radius: 2px;
	}
</style>
