<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PoemCard from '#lib/components/PoemCard.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import { stanzas } from '#lib/poem.ts';
	import { ago, greeting } from '#lib/time.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Time-of-day greeting uses the reader's clock, so compute it in the browser.
	let hello = $state('Welcome back');
	let today = $state('');
	onMount(() => {
		hello = greeting();
		today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
	});

	const firstName = $derived(data.displayName.split(' ')[0]);
	const potd = $derived(data.poemOfDay);
</script>

<svelte:head><title>Discover — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-14">
	<!-- Top bar -->
	<div class="flex flex-wrap items-center justify-between gap-4">
		<form action="/library" class="min-w-[220px] flex-[0_1_380px]">
			<SearchField label="Search poems" placeholder="Search a poem, a feeling, a line…" />
		</form>
		<span class="text-[13px] text-subtle">{today}</span>
	</div>

	<!-- Welcome -->
	<section class="fade flex flex-wrap items-end justify-between gap-6">
		<div class="flex max-w-[620px] flex-col gap-3">
			<h1 class="m-0 font-serif text-[40px] leading-[1.05] font-light tracking-[-0.025em] text-ink sm:text-[52px]">{hello}, <em>{firstName}.</em></h1>
			<p class="m-0 text-base leading-relaxed text-muted">
				{#if data.draft}
					There’s a draft waiting{data.draft.title ? ` — “${data.draft.title}”` : ''} whenever you’re ready.
				{:else}
					Read something slowly. Write if you want to. There’s no wrong way to be here.
				{/if}
			</p>
		</div>
		{#if data.draft}
			<a class="btn btn-ghost" href="/write?id={data.draft.id}">Continue your draft</a>
		{:else}
			<a class="btn btn-ghost" href="/write">Start a reflection</a>
		{/if}
	</section>

	{#if potd}
		<!-- Poem of the day -->
		<section class="fade2 grid grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] border border-line bg-sheet">
			<div class="flex flex-col gap-6 border-line-soft p-8 sm:p-14 md:border-r">
				<span class="eyebrow text-rose">Poem of the day · {potd.category}</span>
				<h2 class="m-0 font-serif text-[30px] font-normal tracking-[-0.01em] text-ink sm:text-4xl">{potd.title}</h2>
				<p class="m-0 font-serif text-[19px] leading-[1.7] whitespace-pre-line text-ink-3 sm:text-[21px]">{stanzas(potd.body)[0]?.join('\n')}</p>
				<span class="text-sm text-muted">— {potd.author}</span>
			</div>
			<div class="flex flex-col justify-between gap-8 bg-sand-2 p-8 sm:p-14">
				<div class="flex flex-col gap-3.5">
					<span class="eyebrow text-subtle">Tonight’s question</span>
					<p class="m-0 font-serif text-[26px] leading-[1.3] font-light text-ink italic sm:text-[30px]">
						{potd.prompts[0] ?? 'What did these words stir in you?'}
					</p>
				</div>
				<div class="flex flex-wrap gap-3">
					<a class="btn btn-primary" href="/read/{potd.slug}">Read the full poem</a>
					<a class="btn btn-ghost" href="/write?poem={potd.slug}">Write about it</a>
				</div>
			</div>
		</section>
	{/if}

	<!-- Categories -->
	<section class="flex flex-col gap-5">
		<div class="flex items-baseline justify-between gap-4">
			<h2 class="m-0 font-serif text-[26px] font-normal text-ink sm:text-[28px]">What are you carrying today?</h2>
			<a href="/library" class="flex-none text-sm font-medium">All categories</a>
		</div>
		<div class="flex flex-wrap gap-2.5">
			{#each data.categories as c (c.id)}<a class="chip" href="/library?category={c.slug}">{c.name}</a>{/each}
		</div>
	</section>

	{#if data.featured.length}
		<section class="flex flex-col gap-5">
			<div class="flex items-baseline justify-between gap-4">
				<h2 class="m-0 font-serif text-[26px] font-normal text-ink sm:text-[28px]">Featured this week</h2>
				<a href="/library" class="flex-none text-sm font-medium">See all</a>
			</div>
			<div class="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-5">
				{#each data.featured as p, i (p.id)}<PoemCard poem={p} delay={i * 80} />{/each}
			</div>
		</section>
	{/if}

	<section class="flex flex-wrap items-start gap-12">
		<div class="flex min-w-0 flex-[2_1_460px] flex-col gap-5">
			<div class="flex flex-col gap-1.5">
				<h2 class="m-0 font-serif text-[26px] font-normal text-ink sm:text-[28px]">Reflections you might need</h2>
				<span class="text-sm text-subtle">Shared anonymously by other readers</span>
			</div>
			{#each data.recs as r (r.id)}
				<article class="card flex flex-col gap-4 border border-line bg-card p-7">
					{#if r.poem_title}<span class="text-xs text-subtle">On <a href="/read/{r.poem_slug}" class="font-serif text-sm italic">{r.poem_title}</a></span>{/if}
					<p class="m-0 line-clamp-5 font-serif text-[19px] leading-[1.6] whitespace-pre-line text-ink-3">{r.body}</p>
					<div class="flex items-center justify-between gap-3 border-t border-line-soft pt-4">
						<span class="text-[13px] text-body">Anonymous · {ago(r.created_at)}</span>
						<span class="flex items-center gap-1.5 text-[13px] text-subtle"><Icon name="heart" size={16} />{r.likes_count}</span>
					</div>
				</article>
			{:else}
				<div class="border border-line bg-card p-7 text-[15px] leading-relaxed text-muted">
					No reflections shared yet. <a href="/community">Be the first, anonymously →</a>
				</div>
			{/each}
		</div>

		<aside class="flex min-w-0 flex-[1_1_300px] flex-col gap-10">
			<div class="flex flex-col gap-1">
				<h2 class="m-0 mb-3 font-serif text-2xl font-normal text-ink">Recently added</h2>
				{#each data.recent as p (p.id)}
					<a class="row flex items-baseline justify-between gap-3 border-b border-line py-3.5 text-ink-2" href="/read/{p.slug}">
						<span class="flex flex-col gap-1"><span class="row-t font-serif text-[19px]">{p.title}</span><span class="text-xs text-subtle">{p.author} · {p.category}</span></span>
						<span class="flex-none text-xs text-subtle">{ago(p.created_at)}</span>
					</a>
				{/each}
			</div>
			{#if data.highlight}
				<div class="flex flex-col gap-4 bg-espresso p-7 text-cream-2">
					<span class="eyebrow text-rose-soft">Community highlight</span>
					<p class="m-0 line-clamp-5 font-serif text-xl leading-[1.55]">“{data.highlight.body}”</p>
					<span class="text-[13px] text-[#CDBFB0]">Anonymous · {data.highlight.likes_count} {data.highlight.likes_count === 1 ? 'person' : 'people'} felt this</span>
					<a href="/community" class="text-sm font-medium text-[#E8C9C4] hover:text-cream">Visit the community →</a>
				</div>
			{/if}
		</aside>
	</section>
</div>

<style>
	.fade {
		animation: pageIn var(--t4) var(--ease-out) both;
	}
	.fade2 {
		animation: pageIn var(--t4) var(--ease-out) 0.15s both;
	}
	.row-t {
		transition: color var(--t2) var(--ease-out);
	}
	.row:hover .row-t {
		color: var(--color-rose);
	}
</style>
