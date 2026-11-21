<script lang="ts">
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { createToast } from '#lib/toast.svelte.ts';
	import { MOODS } from '#lib/types.ts';
	import type { JournalEntry } from './+page.server.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let entries = $state<JournalEntry[]>([]);
	$effect.pre(() => {
		entries = data.entries;
	});

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
	const categories = $derived(
		[...new Map(entries.filter((e) => e.poem?.category).map((e) => [e.poem!.category!.slug, e.poem!.category!.name])).entries()]
	);
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
	const anyFilter = $derived(!!(query || category || month || mood || tag || tab !== 'all'));

	// Private statistics
	const stats = $derived.by(() => {
		const wordsTotal = entries.reduce((n, e) => n + (e.body.trim() ? e.body.trim().split(/\s+/).length : 0), 0);
		const moodCount = new Map<string, number>();
		entries.forEach((e) => e.moods.forEach((m) => moodCount.set(m, (moodCount.get(m) ?? 0) + 1)));
		const topMood = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
		const now = new Date();
		const daysInMonth = now.getDate();
		const thisMonth = now.toISOString().slice(0, 7);
		const wrote = new Set(entries.filter((e) => monthKey(e.created_at) === thisMonth).map((e) => new Date(e.created_at).getDate()));
		return {
			count: entries.length,
			words: wordsTotal,
			topMood,
			days: Array.from({ length: daysInMonth }, (_, i) => wrote.has(i + 1)),
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
	const fmtMeta = (iso: string) => {
		const d = new Date(iso);
		return `${d.toLocaleDateString('en-GB', { month: 'short' })} · ${d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
	};
</script>

<svelte:head><title>My Journal — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-9">
	<header class="flex flex-wrap items-end justify-between gap-5">
		<div class="flex flex-col gap-3.5">
			<span class="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-espresso px-3 text-xs font-medium text-cream"><Icon name="lock" size={14} />Only you can see this page</span>
			<h1 class="m-0 font-serif text-[42px] font-light tracking-[-0.025em] text-ink sm:text-[52px]">My Journal</h1>
		</div>
		<a class="btn btn-primary" href="/write"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>New entry</a>
	</header>

	{#if entries.length}
		<!-- Private statistics -->
		<section aria-label="Your writing, privately" class="stats grid grid-cols-[repeat(auto-fit,minmax(min(200px,100%),1fr))] border border-line bg-card">
			<div class="flex flex-col gap-1.5 p-6"><span class="font-serif text-[40px] font-light text-ink">{stats.count}</span><span class="text-[13px] text-muted">{stats.count === 1 ? 'reflection' : 'reflections'} written</span></div>
			<div class="flex flex-col gap-1.5 p-6"><span class="font-serif text-[40px] font-light text-ink">{stats.words.toLocaleString('en-GB')}</span><span class="text-[13px] text-muted">words, all yours</span></div>
			<div class="flex flex-col gap-1.5 p-6"><span class="font-serif text-[40px] font-light text-ink italic">{stats.topMood ? cap(stats.topMood) : '—'}</span><span class="text-[13px] text-muted">your most frequent feeling</span></div>
			<div class="flex flex-col gap-2.5 p-6">
				<span class="text-[13px] text-muted">Days written in {stats.monthName}</span>
				<div role="img" aria-label="{stats.daysWritten} of {stats.days.length} days" class="grid grid-cols-10 gap-1">
					{#each stats.days as on, i (i)}<span class="h-3.5 rounded-xs" style="background: {on ? '#8E4A4F' : '#E7DED2'}"></span>{/each}
				</div>
			</div>
		</section>

		<!-- Tabs + filters -->
		<section class="flex flex-col gap-4">
			<div role="tablist" aria-label="Entry status" class="flex gap-7 border-b border-line">
				{#each [['all', 'All', entries.length], ['saved', 'Saved', entries.filter((e) => e.status === 'saved').length], ['draft', 'Drafts', entries.filter((e) => e.status === 'draft').length]] as [k, label, n] (k)}
					<button role="tab" class="tab" aria-selected={tab === k} onclick={() => (tab = k as typeof tab)}>{label} <span class="font-normal text-subtle">{n}</span></button>
				{/each}
			</div>
			<div class="flex flex-wrap gap-2.5">
				<div class="flex-[1_1_260px]"><SearchField bind:value={query} label="Search entries" placeholder="Search your entries" /></div>
				<select class="field sel" bind:value={month} aria-label="Month">
					<option value="">All time</option>
					{#each months as m (m)}<option value={m}>{monthLabel(m)}</option>{/each}
				</select>
				{#if categories.length}
					<select class="field sel" bind:value={category} aria-label="Category">
						<option value="">All categories</option>
						{#each categories as [slug, name] (slug)}<option value={slug}>{name}</option>{/each}
					</select>
				{/if}
				<select class="field sel" bind:value={mood} aria-label="Feeling">
					<option value="">Any feeling</option>
					{#each MOODS as m (m)}<option value={m}>{cap(m)}</option>{/each}
				</select>
				{#if allTags.length}
					<select class="field sel" bind:value={tag} aria-label="Tag">
						<option value="">Any tag</option>
						{#each allTags as t (t)}<option value={t}>#{t}</option>{/each}
					</select>
				{/if}
			</div>
		</section>
	{/if}

	<!-- Entries, grouped by month -->
	<section class="flex flex-col gap-3.5" aria-live="polite">
		{#if data.error}
			<p role="alert" class="notice-err">{data.error}</p>
		{:else if !entries.length}
			<div class="rise flex flex-col items-center gap-3 border border-line bg-card px-8 py-16 text-center sm:px-14">
				<svg width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path class="ink" d="M4 28c14-14 24 6 36-4s18-16 28-4 20 10 30 0 12-8 18-6" /></svg>
				<h3 class="m-0 font-serif text-2xl font-normal text-ink">Your journal is waiting.</h3>
				<p class="m-0 max-w-[340px] text-sm leading-relaxed text-muted">Some feelings are difficult to explain. Here, you don’t have to. Just write.</p>
				<a class="btn btn-primary mt-2" href="/write">Write the first line</a>
			</div>
		{:else if !filtered.length}
			<div class="rise flex flex-col items-center gap-3 border border-line bg-card px-8 py-16 text-center sm:px-14">
				<h3 class="m-0 font-serif text-2xl font-normal text-ink">Nothing here matches.</h3>
				<p class="m-0 max-w-[320px] text-sm leading-relaxed text-muted">Your words are still safe — try another search, or a different month.</p>
				<button class="btn btn-ghost" onclick={reset}>Show all entries</button>
			</div>
		{:else}
			{#each grouped as [key, list] (key)}
				<h2 class="m-0 mt-3 font-serif text-xl font-normal text-subtle italic first:mt-0">{monthLabel(key)}</h2>
				{#each list as e, i (e.id)}
					<article class="entry rise grid grid-cols-[56px_minmax(0,1fr)] items-start gap-4 border border-line bg-sheet p-5 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:gap-7 sm:px-8 sm:py-7" style="animation-delay: {Math.min(i, 6) * 60}ms">
						<div class="flex flex-col gap-0.5 pt-1"><span class="font-serif text-[32px] leading-none font-light text-ink sm:text-[40px]">{fmtDay(e.created_at)}</span><span class="text-xs text-subtle">{fmtMeta(e.created_at)}</span></div>
						<div class="flex min-w-0 flex-col gap-2.5">
							<div class="flex flex-wrap items-center gap-2.5">
								{#if e.status === 'draft'}<span class="badge border border-dashed border-faint text-body">Draft</span>
								{:else}<span class="badge bg-espresso text-cream">Private</span>{/if}
								{#if e.poem}<span class="text-xs text-subtle">On <a href="/read/{e.poem.slug}" class="font-serif text-sm italic">{e.poem.title}</a></span>{/if}
							</div>
							<h3 class="m-0 font-serif text-[22px] font-normal text-ink sm:text-[25px]"><a href="/write?id={e.id}" class="text-ink hover:text-rose-dark">{e.title || 'Untitled'}</a></h3>
							<p class="m-0 line-clamp-2 font-serif text-[17px] leading-[1.6] text-body">{e.body || '…'}</p>
							{#if e.moods.length || e.tags.length}
								<div class="flex flex-wrap gap-1.5 pt-1">
									{#each e.moods as m (m)}<span class="pill">{cap(m)}</span>{/each}
									{#each e.tags as t (t)}<button class="pill border-0 hover:bg-line" onclick={() => (tag = t)}>#{t}</button>{/each}
								</div>
							{/if}
						</div>
						<div class="acts col-span-2 flex justify-end gap-0.5 sm:col-span-1">
							<a class="ib" href="/write?id={e.id}" aria-label="Edit {e.title || 'entry'}"><Icon name="pen" size={18} /></a>
							<button class="ib" aria-label="Delete {e.title || 'entry'}" onclick={() => (confirm = e)}><Icon name="trash" size={18} /></button>
						</div>
					</article>
				{/each}
			{/each}
		{/if}
	</section>
</div>

<ConfirmDialog open={!!confirm} title="Let this entry go?" confirmLabel="Delete entry" cancelLabel="Keep it" danger busy={deleting} onconfirm={doDelete} oncancel={() => (confirm = null)}>
	“{confirm?.title || 'Untitled'}” will be deleted for good. This can’t be undone.
</ConfirmDialog>

<Toast open={toast.open} text={toast.text} icon={false} />

<style>
	.stats > div + div {
		border-left: 1px solid var(--color-line-soft);
	}
	.tab {
		min-height: 44px;
		margin-bottom: -1px;
		padding: 0;
		border: 0;
		border-bottom: 2px solid transparent;
		background: none;
		color: var(--color-muted);
		font: 500 14px var(--font-sans);
		transition: color var(--t2) var(--ease-out), border-color var(--t2) var(--ease-out);
	}
	.tab[aria-selected='true'] {
		color: var(--color-ink);
		border-bottom-color: var(--color-rose);
	}
	.sel {
		width: auto;
		flex: 0 1 auto;
		padding-right: 32px;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236F625A' stroke-width='1.6' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
	}
	.badge {
		display: inline-flex;
		align-items: center;
		height: 24px;
		padding: 0 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 500;
	}
	.pill {
		display: inline-flex;
		align-items: center;
		height: 26px;
		padding: 0 10px;
		border-radius: 999px;
		background: var(--color-skel);
		font-size: 12px;
		color: var(--color-body);
	}
	.entry {
		transition: border-color var(--t3) var(--ease-out), box-shadow var(--t3) var(--ease-out);
	}
	.entry:hover {
		border-color: var(--color-line-hover);
		box-shadow: 0 18px 40px -28px rgb(63 50 43 / 0.4);
	}
	.acts {
		opacity: 0.55;
		transition: opacity var(--t2) var(--ease-out);
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
	.ib {
		width: 44px;
		height: 44px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 1px solid transparent;
		border-radius: 2px;
		background: transparent;
		color: var(--color-body);
		transition: color var(--t2) var(--ease-out), border-color var(--t2) var(--ease-out);
	}
	.ib:hover {
		border-color: var(--color-line-strong);
		color: var(--color-ink);
	}
	.ink {
		stroke-dasharray: 160;
		animation: draw 1.6s var(--ease-out) both;
	}
	@keyframes draw {
		from {
			stroke-dashoffset: 160;
		}
	}
</style>
