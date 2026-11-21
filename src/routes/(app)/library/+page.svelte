<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { untrack } from 'svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import PoemCard from '#lib/components/PoemCard.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { setBookmark } from '#lib/bookmarks.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let q = $state(untrack(() => data.filters.q));
	$effect.pre(() => {
		const fromUrl = data.filters.q;
		untrack(() => {
			if (q.trim() !== fromUrl) q = fromUrl; // don't eat a trailing space mid-typing
		});
	});
	let sortOpen = $state(false);
	let saved = $derived(new Set(data.saved));
	const toast = createToast();

	const loading = $derived(navigating.to?.url.pathname === '/library');

	function setParam(changes: Record<string, string>) {
		const u = new URL(page.url.href);
		for (const [k, v] of Object.entries(changes)) v ? u.searchParams.set(k, v) : u.searchParams.delete(k);
		goto(u, { reset: false, replace: true });
	}

	let timer: ReturnType<typeof setTimeout>;
	const onSearch = () => {
		clearTimeout(timer);
		timer = setTimeout(() => setParam({ q: q.trim() }), 350);
	};

	async function toggle(id: string) {
		const on = !saved.has(id);
		const apply = (v: boolean) => {
			const s = new Set(saved);
			v ? s.add(id) : s.delete(id);
			saved = s;
		};
		apply(on);
		if (!(await setBookmark(data.supabase, id, on))) {
			apply(!on);
			toast.show('That didn’t save. Please try again.');
			return;
		}
		toast.show(on ? 'Saved to Bookmarks.' : 'Removed from Bookmarks.', async () => {
			apply(!on);
			await setBookmark(data.supabase, id, !on);
		});
	}

	const filtered = $derived(!!(data.filters.q || data.filters.category || data.filters.kind));
	const activeCategory = $derived(data.categories.find((c) => c.slug === data.filters.category));
	const countLabel = $derived(
		`${data.poems.length} ${data.poems.length === 1 ? 'piece' : 'pieces'}${activeCategory ? ` in ${activeCategory.name}` : ''}${data.filters.q ? ` for “${data.filters.q}”` : ''}`
	);
	function clearAll() {
		q = '';
		setParam({ q: '', category: '', kind: '' });
	}
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (sortOpen = false)} />
<svelte:head><title>Poetry Library — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-10">
	<PageHeader eyebrow="The library" title="Poems & quotes" lede="Original short pieces, gathered by feeling. Take what you need; leave the rest for another day." />

	{#if data.featured.length && !filtered}
		<!-- Featured -->
		<section class="featured grid grid-cols-1 overflow-hidden md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" aria-labelledby="feat-h">
			<div class="flex flex-col justify-center gap-4 p-7 sm:p-10">
				<span class="eyebrow text-rose-soft">Featured · {data.featured.length} pieces</span>
				<h2 id="feat-h" class="m-0 font-serif text-[32px] leading-[1.1] font-light tracking-[-0.02em] sm:text-[38px]">Where to begin</h2>
				<p class="m-0 max-w-[380px] text-[15px] leading-[1.65] text-[#DCD0C3]">
					A few pieces readers return to — about the people we keep, the ones we lose, and finding our way back to ourselves.
				</p>
				<span><a class="btn btn-light" href="/read/{data.featured[0].slug}">Start reading</a></span>
			</div>
			<ol class="m-0 flex list-none flex-col justify-center border-t border-[#5A4A41] p-7 sm:p-10 md:border-t-0 md:border-l">
				{#each data.featured as f, i (f.id)}
					<li>
						<a href="/read/{f.slug}" class="feat-row">
							<span class="font-serif text-sm text-rose-soft italic">{['i', 'ii', 'iii', 'iv'][i]}.</span>
							<span class="flex-1 font-serif text-xl">{f.title}</span>
							<span class="text-[13px] text-[#CDBFB0]">{f.author}</span>
						</a>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	<!-- Search + filters -->
	<section class="controls flex flex-col gap-4" aria-label="Find a poem">
		<SearchField bind:value={q} oninput={onSearch} label="Search the library" placeholder="Search by title, poet or a line you remember" />
		<div role="group" aria-label="Filter by feeling" class="chips">
			<button class="chip" aria-pressed={!data.filters.category} onclick={() => setParam({ category: '' })}>All feelings</button>
			{#each data.categories as c (c.id)}
				<button class="chip" aria-pressed={data.filters.category === c.slug} onclick={() => setParam({ category: data.filters.category === c.slug ? '' : c.slug })}>{c.name}</button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-3">
			<div class="flex flex-wrap items-center gap-x-4 gap-y-2">
				<div role="group" aria-label="Type" class="seg">
					{#each [['', 'All'], ['poem', 'Poems'], ['quote', 'Quotes']] as [k, label] (k)}
						<button aria-pressed={data.filters.kind === k} onclick={() => setParam({ kind: k })}>{label}</button>
					{/each}
				</div>
				<span class="text-[13px] text-subtle" aria-live="polite">{countLabel}</span>
				{#if filtered}<button class="btn btn-quiet btn-sm min-h-8! px-2!" onclick={clearAll}>Clear</button>{/if}
			</div>
			<div class="relative">
				<button class="btn btn-quiet btn-sm" aria-haspopup="listbox" aria-expanded={sortOpen} onclick={() => (sortOpen = !sortOpen)}>
					Sort: {data.sorts[data.filters.sort as keyof typeof data.sorts]}
					<svg class="chev" class:up={sortOpen} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
				</button>
				{#if sortOpen}
					<button class="fixed inset-0 z-20 cursor-default" aria-label="Close sort menu" tabindex="-1" onclick={() => (sortOpen = false)}></button>
					<div class="menu top-[calc(100%+6px)] right-0" role="listbox" aria-label="Sort poems">
						{#each Object.entries(data.sorts) as [k, label] (k)}
							<button class="menu-item" role="option" aria-selected={data.filters.sort === k} onclick={() => { sortOpen = false; setParam({ sort: k === 'newest' ? '' : k }); }}>
								{label}{#if data.filters.sort === k}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" class="text-rose" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>

	{#if loading}
		<section aria-busy="true" aria-label="Loading poems" class="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4">
			{#each [1, 2, 3, 4, 5, 6] as k (k)}
				<div class="surface flex min-h-[240px] flex-col gap-3.5 p-6">
					<div class="skel h-2.5 w-24"></div>
					<div class="skel h-6 w-[64%]"></div>
					<div class="skel h-3.5 w-[92%]"></div>
					<div class="skel h-3.5 w-[78%]"></div>
					<div class="flex-1"></div>
					<div class="skel h-3 w-[40%]"></div>
				</div>
			{/each}
		</section>
	{:else if data.error}
		<EmptyState title="This page has gone quiet." text={data.error}>
			<button class="btn btn-ghost" onclick={() => location.reload()}>Try again</button>
		</EmptyState>
	{:else if data.poems.length}
		<section class="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4" aria-label="Poems">
			{#each data.poems as p, i (p.id)}
				{@const n = data.counts[p.id] ?? 0}
				<PoemCard poem={p} saved={saved.has(p.id)} ontoggle={() => toggle(p.id)} delay={Math.min(i, 8) * 50} footer={n ? `${n} ${n === 1 ? 'reflection' : 'reflections'}` : undefined} />
			{/each}
		</section>
	{:else}
		<EmptyState title="Nothing matches that yet." text="Try a feeling instead of a word, or clear the filters.">
			<button class="btn btn-ghost" onclick={clearAll}>Clear filters</button>
		</EmptyState>
	{/if}
</div>

<Toast open={toast.open} text={toast.text} onundo={toast.undo} />

<style>
	.featured {
		background: #3b2d27; /* deep brown, same in both themes */
		color: #f3ece2;
		border-radius: 2px;
	}
	.btn-light {
		background: #fbf8f3;
		color: #3b2d27;
	}
	.btn-light:hover {
		background: #fff;
		color: #231d1a;
	}
	.feat-row {
		display: flex;
		align-items: baseline;
		gap: 14px;
		padding: 13px 0;
		border-bottom: 1px solid #5a4a41;
		color: #f3ece2;
		transition: padding-left var(--t3) var(--ease-out);
	}
	li:last-child .feat-row {
		border-bottom: 0;
	}
	.feat-row:hover {
		color: #fff;
		padding-left: 4px;
	}
	/* Feelings: one scrollable row on phones, wrapping on larger screens. */
	.chips {
		display: flex;
		gap: 8px;
		overflow-x: auto;
		margin: 0 -20px;
		padding: 2px 20px;
		scrollbar-width: none;
		mask-image: linear-gradient(90deg, transparent, #000 20px, #000 calc(100% - 20px), transparent);
	}
	.chips::-webkit-scrollbar {
		display: none;
	}
	.chips .chip {
		flex: none;
	}
	@media (min-width: 640px) {
		.chips {
			flex-wrap: wrap;
			overflow: visible;
			margin: 0;
			padding: 0;
			mask-image: none;
		}
	}
	/* Segmented control */
	.seg {
		display: inline-flex;
		padding: 3px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: var(--color-card);
	}
	.seg button {
		min-height: 32px;
		padding: 0 14px;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--color-muted);
		font: 500 13px var(--font-sans);
		transition:
			background-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out);
	}
	.seg button[aria-pressed='true'] {
		background: var(--color-espresso);
		color: var(--color-cream);
	}
	.chev {
		transition: transform var(--t2) var(--ease-out);
	}
	.chev.up {
		transform: rotate(180deg);
	}
</style>
