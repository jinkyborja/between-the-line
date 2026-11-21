<script lang="ts">
	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import { untrack } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PoemCard from '#lib/components/PoemCard.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { setBookmark } from '#lib/bookmarks.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let q = $state('');
	$effect.pre(() => {
		const fromUrl = data.filters.q;
		untrack(() => {
			if (q.trim() !== fromUrl) q = fromUrl; // don't eat a trailing space mid-typing
		});
	});
	let sortOpen = $state(false);
	let saved = $state(new Set<string>());
	$effect.pre(() => {
		saved = new Set(data.saved);
	});
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
	const countLabel = $derived(
		`${data.poems.length} ${data.poems.length === 1 ? 'piece' : 'pieces'}${filtered ? ' match' : ''}`
	);
</script>

<svelte:head><title>Poetry Library — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-10">
	<header class="flex flex-col gap-3">
		<p class="eyebrow m-0 text-xs text-subtle">The library</p>
		<h1 class="m-0 font-serif text-[42px] font-light tracking-[-0.025em] text-ink sm:text-[52px]">Poems &amp; quotes</h1>
		<p class="m-0 max-w-[560px] text-base leading-relaxed text-muted">
			Original short pieces, gathered by feeling. Take what you need; leave the rest for another day.
		</p>
	</header>

	{#if data.featured.length && !filtered}
		<!-- Featured -->
		<section class="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] bg-espresso text-cream-2">
			<div class="flex flex-col gap-4.5 p-8 sm:p-12">
				<span class="eyebrow text-rose-soft">Featured · {data.featured.length} pieces</span>
				<h2 class="m-0 font-serif text-[34px] leading-[1.1] font-light tracking-[-0.02em] sm:text-[40px]">Where to begin</h2>
				<p class="m-0 max-w-[400px] text-[15px] leading-[1.65] text-[#DCD0C3]">
					A few pieces readers return to — about the people we keep, the ones we lose, and finding our way back to ourselves.
				</p>
				<span><a class="btn btn-light" href="/read/{data.featured[0].slug}">Start reading</a></span>
			</div>
			<div class="flex flex-col justify-center border-[#5A4A41] p-8 sm:p-12 md:border-l">
				{#each data.featured as f (f.id)}
					<a href="/read/{f.slug}" class="flex items-baseline justify-between gap-4 border-b border-[#5A4A41] py-3.5 text-cream-2 hover:text-cream">
						<span class="font-serif text-xl">{f.title}</span><span class="text-[13px] text-[#CDBFB0]">{f.author}</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Search + filters -->
	<section class="flex flex-col gap-4.5">
		<SearchField bind:value={q} oninput={onSearch} label="Search the library" placeholder="Search by title, poet or a line you remember" />
		<div role="group" aria-label="Filter by category" class="flex flex-wrap gap-2">
			<button class="chip" aria-pressed={!data.filters.category} onclick={() => setParam({ category: '' })}>All</button>
			{#each data.categories as c (c.id)}
				<button class="chip" aria-pressed={data.filters.category === c.slug} onclick={() => setParam({ category: data.filters.category === c.slug ? '' : c.slug })}>{c.name}</button>
			{/each}
		</div>
		<div class="flex flex-wrap items-center justify-between gap-3 text-[13px] text-subtle">
			<div class="flex items-center gap-4">
				<span aria-live="polite">{countLabel}</span>
				<div role="group" aria-label="Type" class="flex gap-1">
					{#each [['', 'All'], ['poem', 'Poems'], ['quote', 'Quotes']] as [k, label] (k)}
						<button class="kind" aria-pressed={data.filters.kind === k} onclick={() => setParam({ kind: k })}>{label}</button>
					{/each}
				</div>
			</div>
			<div class="relative">
				<button class="dd-btn" aria-haspopup="listbox" aria-expanded={sortOpen} onclick={() => (sortOpen = !sortOpen)}>
					Sort: {data.sorts[data.filters.sort as keyof typeof data.sorts]}
					<svg class="chev" class:up={sortOpen} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
				</button>
				{#if sortOpen}
					<button class="fixed inset-0 z-9 cursor-default" aria-label="Close sort menu" onclick={() => (sortOpen = false)}></button>
					<div class="dd-menu" role="listbox" aria-label="Sort poems">
						{#each Object.entries(data.sorts) as [k, label] (k)}
							<button class="dd-item" role="option" aria-selected={data.filters.sort === k} onclick={() => { sortOpen = false; setParam({ sort: k === 'newest' ? '' : k }); }}>
								{label}{#if data.filters.sort === k}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E4A4F" stroke-width="1.6" aria-hidden="true"><path d="m5 12 4 4 10-10" /></svg>{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</section>

	{#if loading}
		<section aria-busy="true" aria-label="Loading poems" class="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
			{#each [1, 2, 3, 4, 5, 6] as k (k)}
				<div class="flex min-h-[248px] flex-col gap-3.5 border border-line bg-sheet p-7">
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
		<div role="alert" class="flex flex-col items-center gap-3 border border-line bg-card p-14 text-center">
			<h3 class="m-0 font-serif text-2xl font-normal text-ink">This page has gone quiet.</h3>
			<p class="m-0 text-sm text-muted">{data.error}</p>
			<button class="chip" onclick={() => location.reload()}>Try again</button>
		</div>
	{:else if data.poems.length}
		<section class="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
			{#each data.poems as p, i (p.id)}
				{@const n = data.counts[p.id] ?? 0}
				<PoemCard poem={p} saved={saved.has(p.id)} ontoggle={() => toggle(p.id)} delay={Math.min(i, 8) * 60} footer={n ? `${n} ${n === 1 ? 'reflection' : 'reflections'}` : undefined} />
			{/each}
		</section>
	{:else}
		<div class="flex flex-col items-center gap-2.5 border border-line bg-card p-14 text-center">
			<h3 class="m-0 font-serif text-2xl font-normal text-ink">Nothing matches that yet.</h3>
			<p class="m-0 text-sm text-muted">Try a feeling instead of a word, or clear the filters.</p>
			<button class="chip mt-2" onclick={() => { q = ''; setParam({ q: '', category: '', kind: '' }); }}>Clear filters</button>
		</div>
	{/if}
</div>

<Toast open={toast.open} text={toast.text} onundo={toast.undo} />

<style>
	.btn-light {
		background: var(--color-cream);
		color: var(--color-espresso);
	}
	.btn-light:hover {
		background: #fff;
		color: var(--color-ink);
	}
	.kind {
		min-height: 32px;
		padding: 0 10px;
		border: 0;
		border-radius: 2px;
		background: transparent;
		color: var(--color-subtle);
		font: 500 13px var(--font-sans);
	}
	.kind[aria-pressed='true'] {
		background: var(--color-sand);
		color: var(--color-ink);
	}
	.dd-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		padding: 0 4px;
		border: 0;
		background: none;
		color: var(--color-body);
		font: 500 13px var(--font-sans);
	}
	.chev {
		transition: transform var(--t2) var(--ease-out);
	}
	.chev.up {
		transform: rotate(180deg);
	}
	.dd-menu {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		z-index: 10;
		min-width: 180px;
		padding: 6px;
		background: var(--color-sheet);
		border: 1px solid var(--color-line);
		box-shadow: 0 20px 40px -24px rgb(63 50 43 / 0.45);
		animation: pageIn var(--t2) var(--ease-out);
	}
	.dd-item {
		width: 100%;
		min-height: 40px;
		padding: 0 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 0;
		background: none;
		color: var(--color-ink-2);
		font: 400 14px var(--font-sans);
		text-align: left;
	}
	.dd-item:hover {
		background: var(--color-paper);
	}
</style>
