<script lang="ts">
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { createToast } from '#lib/toast.svelte.ts';
	import { MOODS } from '#lib/types.ts';
	import type { JournalEntry } from './+page.server.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Writable derived: server-rendered, locally editable, resets on new data.
	let entries = $derived<JournalEntry[]>(data.entries);

	let tab = $state<'all' | 'saved' | 'draft'>('all');
	let query = $state('');
	let category = $state('');
	let month = $state('');
	let mood = $state('');
	let tag = $state('');
	let confirm = $state<JournalEntry | null>(null);
	let deleting = $state(false);
	const toast = createToast();

	const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
	const monthKey = (iso: string) => iso.slice(0, 7);
	const monthLabel = (key: string) =>
		new Date(key + '-01T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

	// Filter options come from your own entries.
	const months = $derived([...new Set(entries.map((e) => monthKey(e.created_at)))]);
	const categories = $derived([
		...new Map(entries.filter((e) => e.poem?.category).map((e) => [e.poem!.category!.slug, e.poem!.category!.name])).entries()
	]);
	const allTags = $derived([...new Set(entries.flatMap((e) => e.tags))].sort());

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return entries.filter(
			(e) =>
				(tab === 'all' || e.status === tab) &&
				(!category || e.poem?.category?.slug === category) &&
				(!month || monthKey(e.created_at) === month) &&
				(!mood || e.moods.includes(mood as never)) &&
				(!tag || e.tags.includes(tag)) &&
				(!q || `${e.title ?? ''} ${e.body} ${e.poem?.title ?? ''} ${e.tags.join(' ')}`.toLowerCase().includes(q))
		);
	});
	const grouped = $derived.by(() => {
		const g = new Map<string, JournalEntry[]>();
		for (const e of filtered) {
			const k = monthKey(e.created_at);
			if (!g.has(k)) g.set(k, []);
			g.get(k)!.push(e);
		}
		return [...g.entries()];
	});
	const activeFilters = $derived([category, month, mood, tag, query.trim()].filter(Boolean).length);
	const counts = $derived({
		all: entries.length,
		saved: entries.filter((e) => e.status === 'saved').length,
		draft: entries.filter((e) => e.status === 'draft').length
	});

	// Private statistics
	const stats = $derived.by(() => {
		const wordsTotal = entries.reduce((n, e) => n + (e.body.trim() ? e.body.trim().split(/\s+/).length : 0), 0);
		const moodCount = new Map<string, number>();
		entries.forEach((e) => e.moods.forEach((m) => moodCount.set(m, (moodCount.get(m) ?? 0) + 1)));
		const topMood = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
		const now = new Date();
		const thisMonth = now.toISOString().slice(0, 7);
		const wrote = new Set(entries.filter((e) => monthKey(e.created_at) === thisMonth).map((e) => new Date(e.created_at).getDate()));
		return {
			words: wordsTotal,
			topMood,
			days: Array.from({ length: now.getDate() }, (_, i) => wrote.has(i + 1)),
			daysWritten: wrote.size,
			monthName: now.toLocaleDateString('en-GB', { month: 'long' })
		};
	});

	function reset() {
		tab = 'all';
		query = category = month = mood = tag = '';
	}

	async function doDelete() {
		if (!confirm) return;
		deleting = true;
		const target = confirm;
		const { error } = await data.supabase.from('reflections').delete().eq('id', target.id);
		deleting = false;
		confirm = null;
		if (error) return toast.show('That entry couldn’t be deleted. Please try again.');
		entries = entries.filter((e) => e.id !== target.id);
		toast.show('Entry deleted.');
	}

	const fmtDay = (iso: string) => new Date(iso).getDate().toString().padStart(2, '0');
	const fmtWeekday = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' });
	const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
	const excerpt = (b: string) => b.trim().replace(/\s+/g, ' ');
</script>

<svelte:head><title>My Journal — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-9">
	<PageHeader title="My Journal" privacy="Only you can see this page" lede="Every entry here is yours alone — never shared, never shown to moderators.">
		{#snippet actions()}
			<a class="btn btn-primary" href="/write"><Icon name="pen" size={17} />New entry</a>
		{/snippet}
	</PageHeader>

	{#if data.error}
		<p role="alert" class="notice-err">{data.error}</p>
	{:else if !entries.length}
		<EmptyState title="Your journal is waiting." text="Some feelings are difficult to explain. Here, you don’t have to. Just write.">
			<a class="btn btn-primary" href="/write">Write the first line</a>
			<a class="btn btn-ghost" href="/library">Find a poem to begin with</a>
		</EmptyState>
	{:else}
		<!-- Private statistics -->
		<section aria-label="Your writing, privately" class="stats surface">
			<div class="stat"><span class="num">{entries.length}</span><span class="lbl">{entries.length === 1 ? 'entry' : 'entries'}</span></div>
			<div class="stat"><span class="num">{stats.words.toLocaleString('en-GB')}</span><span class="lbl">words, all yours</span></div>
			<div class="stat"><span class="num italic">{stats.topMood ? cap(stats.topMood) : '—'}</span><span class="lbl">most frequent feeling</span></div>
			<div class="stat">
				<span class="lbl">{stats.daysWritten} {stats.daysWritten === 1 ? 'day' : 'days'} written in {stats.monthName}</span>
				<div role="img" aria-label="{stats.daysWritten} of {stats.days.length} days this month" class="cal">
					{#each stats.days as on, i (i)}<span class:on></span>{/each}
				</div>
			</div>
		</section>

		<!-- Search first, then status, then refinements -->
		<section class="flex flex-col gap-4" aria-label="Find entries">
			<SearchField bind:value={query} label="Search entries" placeholder="Search titles, words, poems or tags" />
			<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
				<div role="tablist" aria-label="Entry status" class="tabs flex-none">
					{#each [['all', 'All'], ['saved', 'Saved'], ['draft', 'Drafts']] as [k, label] (k)}
						<button role="tab" class="tab" aria-selected={tab === k} onclick={() => (tab = k as typeof tab)}>
							{label} <span class="font-normal text-subtle">{counts[k as keyof typeof counts]}</span>
						</button>
					{/each}
				</div>
				<div class="flex flex-wrap items-center gap-2 pb-1">
					<select class="field field-select h-10! text-[13px]!" bind:value={month} aria-label="Month">
						<option value="">Any month</option>
						{#each months as m (m)}<option value={m}>{monthLabel(m)}</option>{/each}
					</select>
					<select class="field field-select h-10! text-[13px]!" bind:value={mood} aria-label="Feeling">
						<option value="">Any feeling</option>
						{#each MOODS as m (m)}<option value={m}>{cap(m)}</option>{/each}
					</select>
					{#if categories.length}
						<select class="field field-select h-10! text-[13px]!" bind:value={category} aria-label="Category">
							<option value="">Any category</option>
							{#each categories as [slug, name] (slug)}<option value={slug}>{name}</option>{/each}
						</select>
					{/if}
					{#if allTags.length}
						<select class="field field-select h-10! text-[13px]!" bind:value={tag} aria-label="Tag">
							<option value="">Any tag</option>
							{#each allTags as t (t)}<option value={t}>#{t}</option>{/each}
						</select>
					{/if}
				</div>
			</div>
			{#if activeFilters || tab !== 'all'}
				<p class="m-0 flex flex-wrap items-center gap-3 text-[13px] text-subtle" aria-live="polite">
					Showing {filtered.length} of {entries.length}
					<button class="btn btn-quiet btn-sm min-h-8! px-2!" onclick={reset}>Clear filters</button>
				</p>
			{/if}
		</section>

		<!-- Entries, grouped by month -->
		<section class="flex flex-col gap-3" aria-label="Entries">
			{#if !filtered.length}
				<EmptyState title="Nothing here matches." text="Your words are still safe — try another search, or a different month.">
					<button class="btn btn-ghost" onclick={reset}>Show all entries</button>
				</EmptyState>
			{:else}
				{#each grouped as [key, list] (key)}
					<h2 class="month">{monthLabel(key)} <span>{list.length}</span></h2>
					{#each list as e, i (e.id)}
						<article class="entry surface rise" style="animation-delay: {Math.min(i, 6) * 50}ms">
							<div class="date" aria-hidden="true">
								<span class="d">{fmtDay(e.created_at)}</span>
								<span class="w">{fmtWeekday(e.created_at)}</span>
							</div>
							<div class="flex min-w-0 flex-col gap-1.5">
								<h3 class="m-0 font-serif text-[21px] leading-snug font-normal sm:text-[23px]">
									<a href="/write?id={e.id}" class="stretched text-ink hover:text-rose-dark">{e.title || 'Untitled entry'}</a>
								</h3>
								<p class="m-0 line-clamp-2 font-serif text-base leading-[1.6] text-body">{excerpt(e.body) || '…'}</p>
								<div class="meta">
									<span class="sr-only">Written</span><time datetime={e.created_at}>{fmtTime(e.created_at)}</time>
									{#if e.status === 'draft'}<span class="badge badge-draft">Draft</span>{/if}
									{#if e.poem}<span>on <a href="/read/{e.poem.slug}" class="relative z-1 font-serif italic">{e.poem.title}</a></span>{/if}
									{#each e.moods as m (m)}<span class="badge">{cap(m)}</span>{/each}
									{#each e.tags as t (t)}<button class="badge relative z-1 border-0 hover:bg-line" onclick={() => (tag = t)} aria-label="Filter by tag {t}">#{t}</button>{/each}
								</div>
							</div>
							<div class="acts">
								<a class="icon-btn" href="/write?id={e.id}" aria-label="Edit {e.title || 'entry'}"><Icon name="pen" size={17} /></a>
								<button class="icon-btn" aria-label="Delete {e.title || 'entry'}" onclick={() => (confirm = e)}><Icon name="trash" size={17} /></button>
							</div>
						</article>
					{/each}
				{/each}
			{/if}
		</section>
	{/if}
</div>

<ConfirmDialog open={!!confirm} title="Let this entry go?" confirmLabel="Delete entry" cancelLabel="Keep it" danger busy={deleting} onconfirm={doDelete} oncancel={() => (confirm = null)}>
	“{confirm?.title || 'Untitled entry'}” will be deleted for good. This can’t be undone.
</ConfirmDialog>

<Toast open={toast.open} text={toast.text} icon={false} />

<style>
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
	}
	.stat {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 4px;
		padding: 18px 22px;
	}
	.stat + .stat {
		border-left: 1px solid var(--color-line-soft);
	}
	.num {
		font: 300 32px/1.1 var(--font-serif);
		color: var(--color-ink);
	}
	.lbl {
		font-size: 13px;
		color: var(--color-muted);
	}
	.cal {
		display: grid;
		grid-template-columns: repeat(10, minmax(0, 1fr));
		gap: 3px;
		margin-top: 6px;
	}
	.cal span {
		height: 10px;
		border-radius: 2px;
		background: var(--color-line);
	}
	.cal span.on {
		background: var(--color-dusty);
	}
	.month {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin: 18px 0 2px;
		font: italic 400 19px var(--font-serif);
		color: var(--color-subtle);
	}
	.month:first-child {
		margin-top: 0;
	}
	.month span {
		font: 500 12px var(--font-sans);
		color: var(--color-faint);
	}
	.entry {
		position: relative;
		display: grid;
		grid-template-columns: 48px minmax(0, 1fr);
		gap: 6px 16px;
		align-items: start;
		padding: 18px 16px;
		transition:
			border-color var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out);
	}
	@media (min-width: 640px) {
		.entry {
			grid-template-columns: 64px minmax(0, 1fr) auto;
			gap: 20px;
			padding: 22px 24px;
		}
	}
	.entry:hover {
		border-color: var(--color-line-hover);
		box-shadow: var(--shadow-raised);
	}
	.date {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 2px;
		line-height: 1;
	}
	.date .d {
		font: 300 30px var(--font-serif);
		color: var(--color-ink);
	}
	.date .w {
		margin-top: 4px;
		font: 600 10px var(--font-sans);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-subtle);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 10px;
		padding-top: 4px;
		font-size: 12px;
		color: var(--color-subtle);
	}
	.stretched::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.acts {
		position: relative;
		z-index: 1;
		grid-column: 1 / -1;
		display: flex;
		justify-content: flex-end;
		gap: 2px;
		opacity: 0.6;
		transition: opacity var(--t2) var(--ease-out);
	}
	@media (min-width: 640px) {
		.acts {
			grid-column: auto;
		}
	}
	.entry:hover .acts,
	.entry:focus-within .acts {
		opacity: 1;
	}
	@media (hover: none) {
		.acts {
			opacity: 1;
		}
	}
</style>
