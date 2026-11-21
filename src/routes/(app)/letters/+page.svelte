<script lang="ts">
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { LETTER_KINDS, kindOf, longDate, salutationFor } from '#lib/letters.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { Letter, LetterKind } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Writable derived: server-rendered, locally editable, resets on new data.
	let letters = $derived<Letter[]>(data.letters);

	let tab = $state<'all' | 'draft' | 'complete' | 'archived'>('all');
	let kind = $state<LetterKind | ''>('');
	let query = $state('');
	let confirm = $state<Letter | null>(null);
	let deleting = $state(false);
	const toast = createToast();

	const today = new Date().toISOString().slice(0, 10);
	const live = $derived(letters.filter((l) => !l.archived_at));
	const tabs = $derived([
		{ k: 'all' as const, label: 'All letters', n: live.length },
		{ k: 'draft' as const, label: 'Drafts', n: live.filter((l) => l.status === 'draft').length },
		{ k: 'complete' as const, label: 'Finished', n: live.filter((l) => l.status === 'complete').length },
		{ k: 'archived' as const, label: 'Archived', n: letters.length - live.length }
	]);
	const shown = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return letters.filter(
			(l) =>
				(tab === 'archived' ? !!l.archived_at : !l.archived_at && (tab === 'all' || l.status === tab)) &&
				(!kind || l.kind === kind) &&
				(!q || `${l.title ?? ''} ${l.recipient ?? ''} ${l.body}`.toLowerCase().includes(q))
		);
	});

	async function setArchived(l: Letter, on: boolean) {
		const value = on ? new Date().toISOString() : null;
		const { error } = await data.supabase.from('letters').update({ archived_at: value }).eq('id', l.id);
		if (error) return toast.show('That didn’t save. Please try again.');
		letters = letters.map((x) => (x.id === l.id ? { ...x, archived_at: value } : x));
		toast.show(on ? 'Letter archived. It’s kept safe under Archived.' : 'Letter moved back to your letters.', () => setArchived(l, !on));
	}

	async function doDelete() {
		if (!confirm) return;
		deleting = true;
		const target = confirm;
		const { error } = await data.supabase.from('letters').delete().eq('id', target.id);
		deleting = false;
		confirm = null;
		if (error) return toast.show('That letter couldn’t be deleted. Please try again.');
		letters = letters.filter((l) => l.id !== target.id);
		toast.show('Letter deleted.');
	}

	const excerpt = (b: string) => b.trim().split(/\n+/).slice(0, 2).join(' ');
</script>

<svelte:head><title>Letters to Myself — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-10">
	<PageHeader privacy="Private · only you will ever read these" lede="Some things are easier to say on paper — to who you were, who you are, who you’re becoming, or someone you never got to tell.">
		{#snippet titleSnippet()}Letters to <em>Myself</em>{/snippet}
		{#snippet actions()}
			<a class="btn btn-primary" href="/letters/write?kind=present"><Icon name="envelope" size={17} />Write a letter</a>
		{/snippet}
	</PageHeader>

	<!-- Begin a letter: one card per kind -->
	<section aria-labelledby="begin-h" class="flex flex-col gap-4">
		<h2 id="begin-h" class="section-title">Who is this letter for?</h2>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
			{#each LETTER_KINDS as k, i (k.kind)}
				{@const n = live.filter((l) => l.kind === k.kind).length}
				<a href="/letters/write?kind={k.kind}" class="begin paper rise" style="animation-delay: {i * 60}ms">
					<span class="flap" aria-hidden="true"></span>
					<span class="motif" aria-hidden="true">
						{#if k.kind === 'past'}
							<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><path d="M19 5.5A10 10 0 1 0 24.5 21 8 8 0 1 1 19 5.5z" /></svg>
						{:else if k.kind === 'present'}
							<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><circle cx="15" cy="15" r="6.5" /><path d="M15 3v3M15 24v3M3 15h3M24 15h3M6.5 6.5l2 2M21.5 21.5l2 2M6.5 23.5l2-2M21.5 8.5l2-2" /></svg>
						{:else if k.kind === 'future'}
							<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 27V14" /><path d="M15 16c0-5 3.5-8 9-8 0 5.5-3.5 8-9 8z" /><path d="M15 19c0-4-2.8-6.5-7.5-6.5 0 4.5 2.8 6.5 7.5 6.5z" /></svg>
						{:else}
							<svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M3.5 8h23v15h-23z" /><path d="M3.5 8 15 17l11.5-9" /><circle cx="15" cy="17" r="2.6" fill="currentColor" stroke="none" /></svg>
						{/if}
					</span>
					<span class="flex flex-col gap-1">
						<span class="font-serif text-[21px] leading-tight text-ink">{k.label}</span>
						<span class="text-[13px] leading-snug text-muted">{k.line}</span>
					</span>
					<span class="mt-auto flex items-center justify-between gap-2 pt-2 text-[13px]">
						<span class="font-medium text-rose">Begin a letter <span class="arr">→</span></span>
						{#if n}<span class="text-subtle">{n} {n === 1 ? 'letter' : 'letters'}</span>{/if}
					</span>
				</a>
			{/each}
		</div>
	</section>

	{#if data.error}
		<p role="alert" class="notice-err">{data.error}</p>
	{:else if !letters.length}
		<!-- Welcoming empty state -->
		<div class="rise paper flex flex-col items-center gap-4 px-8 py-16 text-center sm:px-14">
			<svg class="ink-draw" width="96" height="64" viewBox="0 0 96 64" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h84v44H6z" /><path d="M6 12l42 28 42-28" /></svg>
			<h2 class="m-0 font-serif text-[28px] font-light text-ink">There’s a letter waiting to be written.</h2>
			<p class="m-0 max-w-[380px] text-sm leading-relaxed text-muted">No one else will ever read it. Not other readers, not moderators — only you.</p>
			<a class="btn btn-primary mt-2" href="/letters/write?kind=present">Write your first letter</a>
		</div>
	{:else}
		<section class="flex flex-col gap-4" aria-labelledby="yours-h">
			<h2 id="yours-h" class="section-title">Your letters</h2>
			<SearchField bind:value={query} label="Search your letters" placeholder="Search titles, names or words" />
			<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
				<div role="tablist" aria-label="Letter status" class="tabs">
					{#each tabs as t (t.k)}
						<button role="tab" class="tab" aria-selected={tab === t.k} onclick={() => (tab = t.k)}>{t.label} <span class="font-normal text-subtle">{t.n}</span></button>
					{/each}
				</div>
				<div role="group" aria-label="Filter by kind" class="flex flex-wrap gap-1.5 pb-1">
					<button class="chip min-h-9!" aria-pressed={!kind} onclick={() => (kind = '')}>All</button>
					{#each LETTER_KINDS as k (k.kind)}
						<button class="chip min-h-9!" aria-pressed={kind === k.kind} onclick={() => (kind = kind === k.kind ? '' : k.kind)}>{k.short}</button>
					{/each}
				</div>
			</div>
		</section>

		{#if shown.length}
			<section class="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4" aria-live="polite" aria-label="Letters">
				{#each shown as l, i (l.id)}
					{@const due = l.remind_on && l.remind_on <= today}
					<article class="envelope rise paper" style="animation-delay: {Math.min(i, 8) * 50}ms">
						<span class="flap" aria-hidden="true"></span>
						<div class="relative flex items-start justify-between gap-3">
							<span class="eyebrow tracking-[0.16em] text-rose">{kindOf(l.kind).short}</span>
							<span class="postmark" aria-hidden="true">
								<span>{new Date(l.created_at).toLocaleDateString('en-GB', { day: '2-digit' })}</span>
								<span>{new Date(l.created_at).toLocaleDateString('en-GB', { month: 'short' })}</span>
							</span>
						</div>
						<p class="relative m-0 font-serif text-[15px] text-subtle italic">{salutationFor(l.kind, l.recipient)}</p>
						<h3 class="m-0 font-serif text-[23px] leading-tight font-normal">
							<a href="/letters/write?id={l.id}" class="stretched text-ink hover:text-rose-dark">{l.title || 'Untitled letter'}</a>
						</h3>
						<p class="relative m-0 line-clamp-2 font-serif text-base leading-[1.6] text-body">{excerpt(l.body) || '…'}</p>

						<div class="relative flex flex-wrap items-center gap-1.5">
							{#if l.status === 'draft'}<span class="badge badge-draft">Draft</span>
							{:else}<span class="badge badge-dark">Finished</span>{/if}
							{#if l.archived_at}<span class="badge">Archived</span>{/if}
							{#if l.remind_on}
								<span class="badge {due ? 'badge-rose' : ''}"><Icon name="envelope" size={13} />{due ? 'Ready to open' : `Opens ${longDate(l.remind_on)}`}</span>
							{/if}
						</div>

						<footer class="relative mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line-strong pt-3">
							<span class="text-xs text-subtle">
								<time datetime={l.created_at}>Written {longDate(l.created_at)}</time>{#if l.updated_at.slice(0, 16) !== l.created_at.slice(0, 16)} · edited {longDate(l.updated_at)}{/if}
							</span>
							<span class="acts">
								<a class="icon-btn size-10!" href="/letters/write?id={l.id}" aria-label="Edit {l.title || 'letter'}"><Icon name="pen" size={17} /></a>
								<button class="icon-btn size-10!" aria-label="{l.archived_at ? 'Unarchive' : 'Archive'} {l.title || 'letter'}" onclick={() => setArchived(l, !l.archived_at)}><Icon name="archive" size={17} /></button>
								<button class="icon-btn size-10!" aria-label="Delete {l.title || 'letter'}" onclick={() => (confirm = l)}><Icon name="trash" size={17} /></button>
							</span>
						</footer>
					</article>
				{/each}
			</section>
		{:else}
			<EmptyState
				title={tab === 'archived' ? 'Nothing archived yet.' : 'No letters match.'}
				text={tab === 'archived' ? 'Finished letters you archive are kept safe here.' : 'Try another word, or show every kind of letter.'}
			>
				<button class="btn btn-ghost" onclick={() => { query = ''; kind = ''; tab = 'all'; }}>Show all letters</button>
			</EmptyState>
		{/if}
	{/if}
</div>

<ConfirmDialog open={!!confirm} title="Let this letter go?" confirmLabel="Delete letter" cancelLabel="Keep it" danger busy={deleting} onconfirm={doDelete} oncancel={() => (confirm = null)}>
	“{confirm?.title || 'Untitled letter'}” will be deleted for good. If you only want it out of sight, you can archive it instead.
</ConfirmDialog>

<Toast open={toast.open} text={toast.text} onundo={toast.undo} icon={false} />

<style>
	/* Ivory stationery with a whisper of paper grain. */
	.paper {
		position: relative;
		border: 1px solid var(--color-line);
		border-radius: 2px;
		background-color: #fdf9f1;
		background-image:
			radial-gradient(rgb(59 45 39 / 0.035) 1px, transparent 1px),
			linear-gradient(180deg, rgb(255 255 255 / 0.5), transparent 40%);
		background-size: 3px 3px, 100% 100%;
	}
	:global([data-theme='dark']) .paper {
		background-color: #26201b;
		background-image: radial-gradient(rgb(255 255 255 / 0.025) 1px, transparent 1px);
	}
	/* Envelope flap: a soft V across the top that lifts on hover. */
	.flap {
		position: absolute;
		inset: 0 0 auto 0;
		height: 56px;
		pointer-events: none;
		background:
			linear-gradient(to bottom right, transparent calc(50% - 0.5px), var(--color-line) 50%, transparent calc(50% + 0.5px)) left / 50% 100% no-repeat,
			linear-gradient(to bottom left, transparent calc(50% - 0.5px), var(--color-line) 50%, transparent calc(50% + 0.5px)) right / 50% 100% no-repeat;
		opacity: 0.7;
		transform-origin: top;
		transition:
			transform var(--t3) var(--ease-out),
			opacity var(--t3) var(--ease-out);
	}
	.begin,
	.envelope {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition:
			border-color var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out),
			transform var(--t3) var(--ease-out);
	}
	.begin {
		gap: 12px;
		min-height: 196px;
		padding: 64px 20px 18px;
		color: inherit;
	}
	.envelope {
		gap: 10px;
		padding: 22px 22px 14px;
	}
	.begin:hover,
	.envelope:hover {
		color: inherit;
		border-color: var(--color-line-hover);
		box-shadow: var(--shadow-raised);
		transform: translateY(-2px);
	}
	.begin:hover .flap,
	.envelope:hover .flap {
		transform: scaleY(0.8);
		opacity: 1;
	}
	.motif {
		position: absolute;
		top: 18px;
		left: 20px;
		color: var(--color-mocha);
		transition: color var(--t3) var(--ease-out);
	}
	.begin:hover .motif {
		color: var(--color-rose);
	}
	.arr {
		display: inline-block;
		transition: transform var(--t2) var(--ease-out);
	}
	.begin:hover .arr {
		transform: translateX(3px);
	}
	.postmark {
		flex: none;
		width: 50px;
		height: 50px;
		border-radius: 50%;
		border: 1px dashed var(--color-dusty);
		color: var(--color-rose);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: var(--font-serif);
		line-height: 1;
		transform: rotate(-8deg);
	}
	.postmark span:first-child {
		font-size: 17px;
	}
	.postmark span:last-child {
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.stretched::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.acts {
		position: relative;
		z-index: 1;
		display: flex;
		gap: 2px;
		opacity: 0.6;
		transition: opacity var(--t2) var(--ease-out);
	}
	.envelope:hover .acts,
	.envelope:focus-within .acts {
		opacity: 1;
	}
	@media (hover: none) {
		.acts {
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.begin:hover,
		.envelope:hover,
		.begin:hover .flap,
		.envelope:hover .flap {
			transform: none;
		}
	}
</style>
