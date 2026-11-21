<script lang="ts">
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import SearchField from '#lib/components/SearchField.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { LETTER_KINDS, kindOf, longDate, salutationFor } from '#lib/letters.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { Letter, LetterKind } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let letters = $state<Letter[]>([]);
	$effect.pre(() => {
		letters = data.letters;
	});

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
	<header class="flex flex-col gap-4">
		<span class="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-espresso px-3 text-xs font-medium text-cream"><Icon name="lock" size={14} />Private · only you will ever read these</span>
		<h1 class="m-0 font-serif text-[42px] font-light tracking-[-0.025em] text-ink sm:text-[52px]">Letters to <em>Myself</em></h1>
		<p class="m-0 max-w-[560px] font-serif text-lg leading-relaxed text-muted italic">Some things are easier to say on paper — to who you were, who you are, who you’re becoming, or someone you never got to tell.</p>
	</header>

	<!-- Begin a letter: one envelope per kind -->
	<section aria-label="Begin a letter" class="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
		{#each LETTER_KINDS as k, i (k.kind)}
			<a href="/letters/write?kind={k.kind}" class="begin rise paper relative flex min-h-[150px] flex-col justify-end gap-1.5 overflow-hidden border border-line p-5 text-ink-2 hover:text-ink-2" style="animation-delay: {i * 70}ms">
				<span class="flap" aria-hidden="true"></span>
				<span class="font-serif text-[22px] leading-tight text-ink">{k.label}</span>
				<span class="text-[13px] leading-snug text-subtle">{k.line}</span>
				<span class="begin-cta mt-1 text-[13px] font-medium text-rose">Begin a letter →</span>
			</a>
		{/each}
	</section>

	{#if data.error}
		<p role="alert" class="notice-err">{data.error}</p>
	{:else if !letters.length}
		<!-- Welcoming empty state -->
		<div class="rise paper flex flex-col items-center gap-4 border border-line px-8 py-16 text-center sm:px-14">
			<svg class="ink-draw" width="96" height="64" viewBox="0 0 96 64" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 12h84v44H6z" /><path d="M6 12l42 28 42-28" /></svg>
			<h2 class="m-0 font-serif text-[28px] font-light text-ink">There’s a letter waiting to be written.</h2>
			<p class="m-0 max-w-[380px] text-sm leading-relaxed text-muted">No one else will ever read it. Not other readers, not moderators — only you.</p>
			<a class="btn btn-primary mt-2" href="/letters/write?kind=present">Write your first letter</a>
		</div>
	{:else}
		<section class="flex flex-col gap-4">
			<div role="tablist" aria-label="Letter status" class="flex flex-wrap gap-x-7 border-b border-line">
				{#each tabs as t (t.k)}
					<button role="tab" class="tab" aria-selected={tab === t.k} onclick={() => (tab = t.k)}>{t.label} <span class="font-normal text-subtle">{t.n}</span></button>
				{/each}
			</div>
			<div class="flex flex-wrap items-center gap-2.5">
				<div class="flex-[1_1_260px]"><SearchField bind:value={query} label="Search your letters" placeholder="Search your letters" /></div>
				<div role="group" aria-label="Filter by kind" class="flex flex-wrap gap-2">
					<button class="chip" aria-pressed={!kind} onclick={() => (kind = '')}>All</button>
					{#each LETTER_KINDS as k (k.kind)}
						<button class="chip" aria-pressed={kind === k.kind} onclick={() => (kind = kind === k.kind ? '' : k.kind)}>{k.short}</button>
					{/each}
				</div>
			</div>
		</section>

		{#if shown.length}
			<section class="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-5" aria-live="polite">
				{#each shown as l, i (l.id)}
					{@const due = l.remind_on && l.remind_on <= today}
					<article class="envelope rise paper relative flex flex-col gap-3 border border-line p-6 sm:p-7" style="animation-delay: {Math.min(i, 8) * 60}ms">
						<span class="flap" aria-hidden="true"></span>
						<div class="relative flex items-start justify-between gap-3">
							<span class="eyebrow tracking-[0.16em] text-rose">{kindOf(l.kind).short}</span>
							<span class="postmark" aria-label="Written {longDate(l.created_at)}">
								<span>{new Date(l.created_at).toLocaleDateString('en-GB', { day: '2-digit' })}</span>
								<span>{new Date(l.created_at).toLocaleDateString('en-GB', { month: 'short' })}</span>
							</span>
						</div>
						<p class="relative m-0 font-serif text-[15px] text-subtle italic">{salutationFor(l.kind, l.recipient)}</p>
						<h3 class="m-0 font-serif text-[24px] leading-tight font-normal">
							<a href="/letters/write?id={l.id}" class="stretched text-ink hover:text-rose-dark">{l.title || 'Untitled letter'}</a>
						</h3>
						<p class="relative m-0 line-clamp-2 font-serif text-base leading-[1.6] text-body">{excerpt(l.body) || '…'}</p>

						<div class="relative flex flex-wrap items-center gap-1.5 pt-1">
							{#if l.status === 'draft'}<span class="badge border border-dashed border-faint text-body">Draft</span>
							{:else}<span class="badge bg-espresso text-cream">Finished</span>{/if}
							{#if l.remind_on}
								<span class="badge {due ? 'bg-rose-tint text-rose-dark' : 'bg-skel text-body'}">
									<Icon name="envelope" size={13} />{due ? 'Ready to open' : `Opens ${longDate(l.remind_on)}`}
								</span>
							{/if}
						</div>

						<footer class="relative mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-line-strong pt-3">
							<span class="text-xs text-subtle">Written {longDate(l.created_at)}{#if l.updated_at.slice(0, 16) !== l.created_at.slice(0, 16)} · edited {longDate(l.updated_at)}{/if}</span>
							<span class="acts relative z-1 flex gap-0.5">
								<a class="ib" href="/letters/write?id={l.id}" aria-label="Edit {l.title || 'letter'}"><Icon name="pen" size={17} /></a>
								<button class="ib" aria-label="{l.archived_at ? 'Unarchive' : 'Archive'} {l.title || 'letter'}" onclick={() => setArchived(l, !l.archived_at)}><Icon name="archive" size={17} /></button>
								<button class="ib" aria-label="Delete {l.title || 'letter'}" onclick={() => (confirm = l)}><Icon name="trash" size={17} /></button>
							</span>
						</footer>
					</article>
				{/each}
			</section>
		{:else}
			<div class="paper flex flex-col items-center gap-3 border border-line px-8 py-14 text-center">
				<h3 class="m-0 font-serif text-2xl font-normal text-ink">{tab === 'archived' ? 'Nothing archived yet.' : 'No letters match.'}</h3>
				<p class="m-0 max-w-[340px] text-sm text-muted">{tab === 'archived' ? 'Finished letters you archive are kept safe here.' : 'Try another word, or show every kind of letter.'}</p>
				<button class="btn btn-ghost mt-1" onclick={() => { query = ''; kind = ''; tab = 'all'; }}>Show all letters</button>
			</div>
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
		background-color: #fdf9f1;
		background-image:
			radial-gradient(rgb(63 50 43 / 0.035) 1px, transparent 1px),
			linear-gradient(180deg, rgb(255 255 255 / 0.5), transparent 40%);
		background-size: 3px 3px, 100% 100%;
	}
	:global([data-theme='dark']) .paper {
		background-color: #26201b;
		background-image: radial-gradient(rgb(255 255 255 / 0.025) 1px, transparent 1px);
	}
	/* Envelope flap: a soft V drawn across the top. */
	.flap {
		position: absolute;
		inset: 0 0 auto 0;
		height: 46%;
		pointer-events: none;
		background:
			linear-gradient(to bottom right, transparent calc(50% - 0.5px), var(--color-line) 50%, transparent calc(50% + 0.5px)) left / 50% 100% no-repeat,
			linear-gradient(to bottom left, transparent calc(50% - 0.5px), var(--color-line) 50%, transparent calc(50% + 0.5px)) right / 50% 100% no-repeat;
		opacity: 0.7;
		transform-origin: top;
		transition: transform var(--t3) var(--ease-out), opacity var(--t3) var(--ease-out);
	}
	.envelope .flap {
		height: 64px;
	}
	.envelope,
	.begin {
		transition:
			border-color var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out),
			transform var(--t3) var(--ease-out);
	}
	.envelope:hover,
	.begin:hover {
		border-color: var(--color-line-hover);
		box-shadow: 0 22px 44px -30px rgb(63 50 43 / 0.42);
		transform: translateY(-2px);
	}
	/* The flap lifts a little, as if the letter were about to be opened. */
	.envelope:hover .flap,
	.begin:hover .flap {
		transform: scaleY(0.82);
		opacity: 1;
	}
	.begin-cta {
		opacity: 0;
		transform: translateY(4px);
		transition: opacity var(--t3) var(--ease-out), transform var(--t3) var(--ease-out);
	}
	.begin:hover .begin-cta,
	.begin:focus-visible .begin-cta {
		opacity: 1;
		transform: none;
	}
	@media (hover: none) {
		.begin-cta {
			opacity: 1;
			transform: none;
		}
	}
	.postmark {
		flex: none;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		border: 1px dashed var(--color-rose-soft);
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
		font-size: 18px;
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
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 24px;
		padding: 0 10px;
		border-radius: 999px;
		font-size: 11px;
		font-weight: 500;
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
	.acts {
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
	.ib {
		width: 40px;
		height: 40px;
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
	@media (prefers-reduced-motion: reduce) {
		.envelope:hover,
		.begin:hover {
			transform: none;
		}
		.envelope:hover .flap,
		.begin:hover .flap {
			transform: none;
		}
	}
</style>
