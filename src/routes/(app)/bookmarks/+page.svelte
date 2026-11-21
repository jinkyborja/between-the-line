<script lang="ts">
	import EmptyState from '#lib/components/EmptyState.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import PoemCard from '#lib/components/PoemCard.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { setBookmark } from '#lib/bookmarks.ts';
	import { ago } from '#lib/time.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Item = (typeof data.items)[number];
	// Writable derived: server-rendered, locally editable (undo), resets on new data.
	let items = $derived<Item[]>(data.items);
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
	<PageHeader title="Bookmarks" lede="The lines you wanted to keep close." />

	{#if data.error}
		<EmptyState title="This page has gone quiet." text={data.error}>
			<button class="btn btn-ghost" onclick={() => location.reload()}>Try again</button>
		</EmptyState>
	{:else if items.length}
		<div role="tablist" aria-label="Bookmark type" class="tabs">
			{#each tabs as t (t.k)}
				<button role="tab" class="tab" aria-selected={tab === t.k} onclick={() => (tab = t.k)}>
					{t.label} <span class="font-normal text-subtle">{t.count}</span>
				</button>
			{/each}
		</div>
		{#if shown.length}
			<section class="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-4" aria-label="Saved poems">
				{#each shown as b, i (b.poem.id)}
					<PoemCard poem={b.poem} saved ontoggle={() => remove(b)} delay={Math.min(i, 8) * 50} footer="Saved {ago(b.savedAt)}" />
				{/each}
			</section>
		{:else}
			<EmptyState title="No {tab === 'poem' ? 'poems' : 'quotes'} saved yet." text="Switch back to All to see everything you’ve kept.">
				<button class="btn btn-ghost" onclick={() => (tab = 'all')}>Show all</button>
			</EmptyState>
		{/if}
	{:else}
		<EmptyState title="Nothing saved here yet." text="When a line stays with you, tap the ribbon to keep it.">
			<a class="btn btn-ghost" href="/library">Browse the library</a>
		</EmptyState>
	{/if}
</div>

<Toast open={toast.open} text={toast.text} onundo={toast.undo} />
