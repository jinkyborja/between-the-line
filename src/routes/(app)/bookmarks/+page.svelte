<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { setBookmark } from '#lib/bookmarks.ts';
	import { excerpt } from '#lib/poem.ts';
	import { ago } from '#lib/time.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Item = (typeof data.items)[number];
	let items = $state<Item[]>([]);
	$effect.pre(() => {
		items = data.items;
	});
	let tab = $state<'all' | 'poem' | 'quote'>('all');
	const toast = createToast();

	const tabs = $derived([
		{ k: 'all' as const, label: 'All', count: items.length },
		{ k: 'poem' as const, label: 'Poems', count: items.filter((i) => i.poem.kind === 'poem').length },
		{ k: 'quote' as const, label: 'Quotes', count: items.filter((i) => i.poem.kind === 'quote').length }
	]);
	const shown = $derived(tab === 'all' ? items : items.filter((i) => i.poem.kind === tab));

	async function remove(item: Item) {
		const index = items.indexOf(item);
		items = items.filter((i) => i !== item);
		if (!(await setBookmark(data.supabase, item.poem.id, false))) {
			items = [...items.slice(0, index), item, ...items.slice(index)];
			toast.show('That didn’t work. Please try again.');
			return;
		}
		toast.show('Removed from Bookmarks.', async () => {
			if (await setBookmark(data.supabase, item.poem.id, true)) {
				const next = [...items];
				next.splice(Math.min(index, next.length), 0, item);
				items = next;
			}
		});
	}
</script>

<svelte:head><title>Bookmarks — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-8">
	<header class="flex flex-col gap-3">
		<h1 class="m-0 font-serif text-[42px] font-light tracking-[-0.025em] text-ink sm:text-[52px]">Bookmarks</h1>
		<p class="m-0 text-base leading-relaxed text-muted">The lines you wanted to keep close.</p>
	</header>

	<div role="tablist" aria-label="Bookmark type" class="flex gap-7 border-b border-line">
		{#each tabs as t (t.k)}
			<button role="tab" class="tab" aria-selected={tab === t.k} onclick={() => (tab = t.k)}>
				{t.label} <span class="font-normal text-subtle">{t.count}</span>
			</button>
		{/each}
	</div>

	{#if data.error}
		<p role="alert" class="notice-err">{data.error}</p>
	{:else if shown.length}
		<section class="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
			{#each shown as b, i (b.poem.id)}
				<article class="card rise relative flex flex-col gap-3.5 border border-line bg-sheet p-7" style="animation-delay: {Math.min(i, 8) * 60}ms">
					<div class="flex min-h-6 items-center justify-between">
						<span class="eyebrow tracking-[0.16em] text-rose">{b.poem.category} · {b.poem.kind === 'quote' ? 'Quote' : 'Poem'}</span>
						<button class="bm" aria-label="Remove {b.poem.title} from bookmarks" onclick={() => remove(b)}><Icon name="bookmark" size={18} filled /></button>
					</div>
					{#if b.poem.kind === 'poem'}
						<a href="/read/{b.poem.slug}" class="font-serif text-2xl text-ink hover:text-rose-dark">{b.poem.title}</a>
						<p class="m-0 flex-1 font-serif text-[17px] leading-[1.6] whitespace-pre-line text-ink-3">{excerpt(b.poem.body, 4).split('\n\n')[0]}</p>
					{:else}
						<a href="/read/{b.poem.slug}" class="flex-1 font-serif text-[21px] leading-[1.5] text-ink-3 hover:text-rose-dark">“{b.poem.body}”</a>
					{/if}
					<div class="flex justify-between text-[13px] text-muted"><span>— {b.poem.author}</span><span>Saved {ago(b.savedAt)}</span></div>
				</article>
			{/each}
		</section>
	{:else}
		<div class="rise flex flex-col items-center gap-3 border border-line bg-card px-8 py-16 text-center sm:px-14">
			<svg width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path class="ink" d="M4 28c14-14 24 6 36-4s18-16 28-4 20 10 30 0 12-8 18-6" /></svg>
			<h3 class="m-0 font-serif text-2xl font-normal text-ink">Nothing saved here yet.</h3>
			<p class="m-0 text-sm text-muted">When a line stays with you, tap the ribbon to keep it.</p>
			<a href="/library" class="text-sm font-medium">Browse the library →</a>
		</div>
	{/if}
</div>

<Toast open={toast.open} text={toast.text} onundo={toast.undo} />

<style>
	.tab {
		min-height: 44px;
		margin-bottom: -1px;
		padding: 0;
		border: 0;
		border-bottom: 2px solid transparent;
		background: none;
		color: var(--color-muted);
		font: 500 14px var(--font-sans);
		transition:
			color var(--t2) var(--ease-out),
			border-color var(--t2) var(--ease-out);
	}
	.tab[aria-selected='true'] {
		color: var(--color-ink);
		border-bottom-color: var(--color-rose);
	}
	.bm {
		width: 44px;
		height: 44px;
		margin: -10px -10px -10px 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background: none;
		color: var(--color-rose);
	}
	.bm:hover {
		color: var(--color-rose-dark);
	}
	.ink {
		stroke-dasharray: 160;
		animation: draw 1.6s var(--ease-out) both;
	}
	@keyframes draw {
		from {
			stroke-dashoffset: 160;
		}
		to {
			stroke-dashoffset: 0;
		}
	}
</style>
