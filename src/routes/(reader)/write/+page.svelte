<script lang="ts">
	import { beforeNavigate, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { stanzas } from '#lib/poem.ts';
	import { MOODS, type Mood } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const DEFAULT_PROMPTS = [
		'What did these words awaken in you?',
		'Who did you think of while reading?',
		'Which line stayed with you, and why?',
		'If you could answer the poet, what would you say?'
	];
	const FREE_PROMPTS = [
		'What are you carrying today?',
		'What would you say if no one would ever read it?',
		'What do you wish someone had asked you this week?',
		'What feels unfinished?'
	];

	// Editor state, seeded once from the loaded entry.
	const seed = untrack(() => data.entry);
	let id = $state<string | null>(seed?.id ?? null);
	let title = $state(seed?.title ?? '');
	let body = $state(seed?.body ?? '');
	let moods = $state<Mood[]>(seed?.moods ?? []);
	let tags = $state<string[]>(seed?.tags ?? []);
	let status = $state<'draft' | 'saved'>(seed?.status ?? 'draft');
	let tagInput = $state('');

	type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';
	let save = $state<SaveState>(seed ? 'saved' : 'idle');
	let savedAt = $state<Date | null>(seed ? new Date(seed.updated_at) : null);
	let dirty = false;
	let banner = $state<string | null>(null);
	let focused = $state(false);
	let typing = $state(false);
	let focusMode = $state(false);
	let showPrompts = $state(untrack(() => !data.entry));
	let bodyEl = $state<HTMLTextAreaElement>();

	const poem = $derived(data.poem);
	const prompts = $derived(
		poem?.reflection_prompts.length ? [...poem.reflection_prompts, ...DEFAULT_PROMPTS].slice(0, 4) : poem ? DEFAULT_PROMPTS : FREE_PROMPTS
	);
	let promptIndex = $state(0);
	const words = $derived(body.trim() ? body.trim().split(/\s+/).length : 0);
	const minutes = $derived(Math.max(1, Math.round(words / 200)));
	const excerptLines = $derived(poem ? (stanzas(poem.body).at(-2) ?? stanzas(poem.body)[0] ?? []).join('\n') : '');
	const backHref = $derived(poem && !seed ? `/read/${poem.slug}` : '/journal');
	const empty = $derived(!title.trim() && !body.trim());

	// ---- Autosave -------------------------------------------------------
	let timer: ReturnType<typeof setTimeout>;
	let idleTimer: ReturnType<typeof setTimeout>;
	let inflight: Promise<void> = Promise.resolve();

	function touch() {
		dirty = true;
		banner = null;
		typing = true;
		save = 'dirty';
		clearTimeout(timer);
		clearTimeout(idleTimer);
		timer = setTimeout(flush, 900);
		idleTimer = setTimeout(() => (typing = false), 2600);
	}

	function flush(): Promise<void> {
		clearTimeout(timer);
		inflight = inflight.then(async () => {
			if (!dirty) return;
			if (!id && !title.trim() && !body.trim()) {
				dirty = false;
				save = 'idle';
				return;
			}
			dirty = false;
			save = 'saving';
			const row = {
				title: title.trim() || null,
				body,
				moods,
				tags,
				status,
				poem_id: poem?.id ?? null
			};
			// user_id is set by the database default and enforced by RLS.
			const res = id
				? await data.supabase.from('reflections').update(row).eq('id', id).select('id').single()
				: await data.supabase.from('reflections').insert(row).select('id').single();
			if (res.error) {
				dirty = true;
				save = 'error';
				return;
			}
			if (!id) {
				id = res.data.id as string;
				const u = new URL(page.url.href);
				u.searchParams.set('id', id);
				u.searchParams.delete('poem');
				replaceState(u, {});
			}
			savedAt = new Date();
			save = dirty ? 'dirty' : 'saved';
		});
		return inflight;
	}

	async function finish(next: 'draft' | 'saved') {
		status = next;
		dirty = true;
		await flush();
		if (save === 'saved')
			banner = next === 'saved' ? 'Saved to your journal. Only you can see it.' : 'Kept as a draft. It’s waiting in My Journal.';
	}

	// Flush before leaving inside the app; warn on tab close if something is unsaved.
	beforeNavigate(({ willUnload, cancel, to }) => {
		if (!dirty && save !== 'saving') return;
		if (willUnload) return cancel();
		if (to) flush();
	});
	onMount(() => () => {
		clearTimeout(timer);
		clearTimeout(idleTimer);
	});

	// Ctrl/⌘+S saves right away (the browser's own save dialog is suppressed).
	function onKey(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
			e.preventDefault();
			if (!empty) {
				dirty = true;
				flush();
			}
		}
	}

	// The sheet grows with the writing instead of scrolling inside itself.
	$effect(() => {
		void body;
		if (!bodyEl) return;
		bodyEl.style.height = 'auto';
		bodyEl.style.height = Math.max(bodyEl.scrollHeight, 420) + 'px';
	});

	function toggleMood(m: Mood) {
		moods = moods.includes(m) ? moods.filter((x) => x !== m) : moods.length < 4 ? [...moods, m] : moods;
		touch();
	}
	function addTag() {
		const t = tagInput.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-').slice(0, 32);
		tagInput = '';
		if (!t || tags.includes(t) || tags.length >= 12) return;
		tags = [...tags, t];
		touch();
	}
	function removeTag(t: string) {
		tags = tags.filter((x) => x !== t);
		touch();
	}
	function usePrompt(i: number) {
		promptIndex = i;
		bodyEl?.focus();
	}

	const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });
	const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
</script>

<svelte:window onkeydown={onKey} />
<svelte:head><title>{title || 'New reflection'} — Between the Lines</title></svelte:head>

<div class="flex min-h-screen flex-col bg-paper">
	<!-- Studio bar -->
	<header class="bar sticky top-0 z-5 border-b border-line">
		<div class="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-3 py-2 sm:px-6">
			<a class="btn btn-quiet btn-sm" href={backHref}><Icon name="close" size={16} /><span class="hidden sm:inline">Close</span></a>

			<div class="flex min-w-0 items-center gap-3 text-[13px]">
				<span role="status" aria-live="polite" class="status" data-state={save}>
					{#if save === 'saving'}<span class="pulse"></span>Saving…
					{:else if save === 'dirty'}<span class="dot"></span>Unsaved changes
					{:else if save === 'error'}<Icon name="close" size={14} />Not saved
						<button class="retry" onclick={() => { dirty = true; flush(); }}>Retry</button>
					{:else if save === 'saved' && savedAt}<Icon name="lock" size={13} />Saved privately · {time(savedAt)}
					{:else}<Icon name="lock" size={13} />Private · saves as you write{/if}
				</span>
				<span class="hidden text-subtle sm:inline">{words} {words === 1 ? 'word' : 'words'}{words > 60 ? ` · ${minutes} min` : ''}</span>
			</div>

			<div class="flex items-center gap-1.5">
				<button class="icon-btn hidden lg:inline-flex" aria-pressed={focusMode} aria-label={focusMode ? 'Show side panel' : 'Focus: hide side panel'} title={focusMode ? 'Show side panel' : 'Focus mode'} onclick={() => (focusMode = !focusMode)}>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
				</button>
				<button class="btn btn-ghost btn-sm hidden sm:inline-flex" onclick={() => finish('draft')} disabled={empty}>Save draft</button>
				<button class="btn btn-primary btn-sm" onclick={() => finish('saved')} disabled={empty}>Save to journal</button>
			</div>
		</div>
	</header>

	{#if banner}
		<div class="banner" role="status">
			{banner} <a href="/journal">Open My Journal</a>
		</div>
	{/if}

	<div class="studio mx-auto w-full max-w-[1200px] flex-1 px-3 pt-6 pb-16 sm:px-6 sm:pt-10" class:focus-mode={focusMode}>
		<!-- The sheet -->
		<main class="min-w-0">
			<h1 class="sr-only">{id ? 'Edit journal entry' : 'New journal entry'}{poem ? ` — reflecting on ${poem.title}` : ''}</h1>
			<div class="sheet" class:focus={focused}>
				<p class="m-0 font-serif text-lg text-rose italic sm:text-xl">{prompts[promptIndex]}</p>
				<label class="sr-only" for="ttl">Title</label>
				<input
					id="ttl"
					type="text"
					maxlength="160"
					bind:value={title}
					oninput={touch}
					onfocus={() => (focused = true)}
					onblur={() => (focused = false)}
					placeholder="Give it a title, or don’t"
					class="ttl"
				/>
				<label class="sr-only" for="body">Your reflection</label>
				<textarea
					id="body"
					bind:this={bodyEl}
					bind:value={body}
					oninput={touch}
					onfocus={() => (focused = true)}
					onblur={() => (focused = false)}
					maxlength="50000"
					placeholder="Start anywhere. No one is grading this."
					class="body"
				></textarea>
			</div>
			<p class="mt-3 text-center text-xs text-subtle sm:hidden">{words} {words === 1 ? 'word' : 'words'} · Ctrl/⌘ + S saves</p>
		</main>

		<!-- Supporting panel -->
		<aside class="panel" class:quiet={typing} aria-label="About this entry">
			{#if poem}
				<div class="surface settle flex flex-col gap-2.5 p-5">
					<span class="eyebrow text-rose">Reflecting on</span>
					<a href="/read/{poem.slug}" class="font-serif text-[21px] leading-tight text-ink" style="view-transition-name: poem-title">{poem.title}</a>
					<p class="m-0 font-serif text-[15px] leading-[1.65] whitespace-pre-line text-ink-3">{poem.kind === 'quote' ? `“${poem.body}”` : excerptLines}</p>
					<span class="text-[13px] text-muted">— {poem.author}</span>
				</div>
			{/if}

			<div class="block-p">
				<button class="disclose" aria-expanded={showPrompts} onclick={() => (showPrompts = !showPrompts)}>
					<span>Need a starting point?</span>
					<svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
				</button>
				{#if showPrompts}
					<ul class="prompts m-0 flex list-none flex-col gap-0.5 p-0">
						{#each prompts as p, i (p)}
							<li><button class="prompt" aria-pressed={promptIndex === i} onclick={() => usePrompt(i)}>{p}</button></li>
						{/each}
					</ul>
				{/if}
			</div>

			<fieldset class="block-p m-0 border-0">
				<legend class="label">How does it feel? <span class="hint">up to 4</span></legend>
				<div class="flex flex-wrap gap-1.5">
					{#each MOODS as m (m)}
						<button class="mood" aria-pressed={moods.includes(m)} onclick={() => toggleMood(m)}>{cap(m)}</button>
					{/each}
				</div>
			</fieldset>

			<div class="block-p">
				<label for="tag" class="label">Tags <span class="hint">private</span></label>
				{#if tags.length}
					<div class="mb-2 flex flex-wrap gap-1.5">
						{#each tags as t (t)}
							<span class="tag">#{t}<button aria-label="Remove tag {t}" onclick={() => removeTag(t)}><Icon name="close" size={11} /></button></span>
						{/each}
					</div>
				{/if}
				<form class="flex gap-2" onsubmit={(e) => { e.preventDefault(); addTag(); }}>
					<input id="tag" class="field h-10!" placeholder="family, home…" bind:value={tagInput} maxlength="32" disabled={tags.length >= 12} />
					<button class="btn btn-ghost btn-sm min-h-10!" disabled={!tagInput.trim()}>Add</button>
				</form>
			</div>

			<div class="privacy">
				<span class="mt-0.5 flex-none"><Icon name="lock" size={15} /></span>
				<span>Only you can read this — not other readers, not moderators.
					<a href="/community/new{poem ? `?poem=${poem.slug}` : ''}">Share something anonymously</a> as a separate post instead.</span>
			</div>

			<button class="btn btn-ghost sm:hidden" onclick={() => finish('draft')} disabled={empty}>Save draft</button>
		</aside>
	</div>
</div>

<style>
	.bar {
		background: rgb(247 242 234 / 0.94);
		backdrop-filter: blur(8px);
	}
	:global([data-theme='dark']) .bar {
		background: rgb(29 25 22 / 0.94);
	}

	/* Save status */
	.status {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-height: 30px;
		padding: 0 10px;
		border-radius: 999px;
		color: var(--color-subtle);
		white-space: nowrap;
		transition:
			background-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out);
	}
	.status[data-state='saved'] {
		color: #4f6b55;
	}
	.status[data-state='error'] {
		background: #f8ecea;
		color: var(--color-danger);
	}
	:global([data-theme='dark']) .status[data-state='saved'] {
		color: #9fbfa6;
	}
	:global([data-theme='dark']) .status[data-state='error'] {
		background: #3a2627;
	}
	.dot,
	.pulse {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-mocha);
	}
	.pulse {
		animation: pulse 1.4s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.25;
		}
	}
	.retry {
		margin-left: 2px;
		border: 0;
		background: none;
		padding: 0;
		color: inherit;
		font: 600 13px var(--font-sans);
		text-decoration: underline;
	}
	.banner {
		padding: 12px 16px;
		background: #2b2522;
		color: #f3ece2;
		text-align: center;
		font-size: 14px;
		animation: pageIn var(--t3) var(--ease-out) both;
	}
	.banner a {
		margin-left: 8px;
		color: #e8c9c4;
		font-weight: 500;
	}

	/* Layout: sheet first; supporting panel beside it on large screens. */
	.studio {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 28px;
		align-items: start;
	}
	@media (min-width: 1024px) {
		.studio {
			grid-template-columns: minmax(0, 1fr) 300px;
			gap: 40px;
		}
		.studio.focus-mode {
			grid-template-columns: minmax(0, 1fr) 0px;
			gap: 0;
		}
		.studio.focus-mode .panel {
			opacity: 0;
			visibility: hidden;
			pointer-events: none;
		}
		.studio.focus-mode main {
			max-width: 820px;
			margin: 0 auto;
			width: 100%;
		}
	}

	/* The sheet */
	.sheet {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 32px 22px 40px;
		background: var(--color-sheet);
		border: 1px solid var(--color-line);
		border-radius: 2px;
		box-shadow: 0 30px 60px -48px rgb(59 45 39 / 0.5);
		transition:
			border-color var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out),
			background-color var(--t3) var(--ease-out);
	}
	@media (min-width: 640px) {
		.sheet {
			padding: 52px 64px 56px;
		}
	}
	.sheet.focus {
		border-color: #d9c9b5;
		background-color: #fefcf8;
		box-shadow:
			0 0 0 4px rgb(201 168 155 / 0.18),
			0 40px 80px -52px rgb(59 45 39 / 0.55);
	}
	:global([data-theme='dark']) .sheet.focus {
		background-color: #262019;
		border-color: var(--color-line-hover);
	}
	.ttl {
		border: 0;
		background: transparent;
		padding: 0;
		outline: none;
		font: 300 30px/1.15 var(--font-serif);
		letter-spacing: -0.02em;
		color: var(--color-ink);
	}
	@media (min-width: 640px) {
		.ttl {
			font-size: 38px;
		}
	}
	.body {
		min-height: 420px;
		resize: none;
		overflow: hidden;
		border: 0;
		padding: 0;
		background: transparent;
		outline: none;
		font: 400 19px/1.8 var(--font-serif);
		color: var(--color-ink-2);
		max-width: 68ch;
	}
	@media (min-width: 640px) {
		.body {
			font-size: 20px;
		}
	}
	.ttl::placeholder,
	.body::placeholder {
		color: var(--color-faint);
	}

	/* Supporting panel */
	.panel {
		display: flex;
		flex-direction: column;
		gap: 14px;
		transition:
			opacity var(--t4) var(--ease-out),
			visibility 0s;
	}
	@media (min-width: 1024px) {
		.panel {
			position: sticky;
			top: 76px;
			max-height: calc(100vh - 96px);
			overflow-y: auto;
			scrollbar-width: thin;
		}
		.panel.quiet {
			opacity: 0.5;
		}
		.panel.quiet:hover,
		.panel.quiet:focus-within {
			opacity: 1;
		}
	}
	.block-p {
		padding: 16px;
		background: var(--color-card);
		border: 1px solid var(--color-line);
		border-radius: 2px;
	}
	.label {
		display: block;
		padding: 0 0 10px;
		font: 600 11px var(--font-sans);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-subtle);
	}
	.hint {
		margin-left: 4px;
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
		color: var(--color-faint);
	}
	.disclose {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 0;
		background: none;
		padding: 0;
		min-height: 24px;
		font: 600 11px var(--font-sans);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-subtle);
	}
	.chev {
		transition: transform var(--t2) var(--ease-out);
	}
	.disclose[aria-expanded='true'] .chev {
		transform: rotate(180deg);
	}
	.prompts {
		margin-top: 10px;
		animation: pageIn var(--t3) var(--ease-out);
	}
	.prompt {
		width: 100%;
		text-align: left;
		padding: 9px 10px;
		border: 1px solid transparent;
		border-radius: 2px;
		background: transparent;
		font: italic 400 15.5px/1.45 var(--font-serif);
		color: var(--color-body);
		transition:
			background-color var(--t2) var(--ease-out),
			border-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out);
	}
	.prompt:hover,
	.prompt[aria-pressed='true'] {
		background: var(--color-sheet);
		border-color: var(--color-line);
		color: var(--color-ink);
	}
	.mood {
		min-height: 32px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1px solid var(--color-line-strong);
		background: transparent;
		font: 500 12px var(--font-sans);
		color: var(--color-body);
		transition: all var(--t2) var(--ease-out);
	}
	.mood:hover {
		border-color: var(--color-mocha);
	}
	.mood[aria-pressed='true'] {
		background: var(--color-rose-tint);
		border-color: var(--color-dusty);
		color: var(--color-rose-dark);
	}
	.tag {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		height: 28px;
		padding: 0 2px 0 10px;
		border-radius: 999px;
		background: var(--color-skel);
		font-size: 12px;
		color: var(--color-body);
	}
	.tag button {
		width: 24px;
		height: 24px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 50%;
		background: none;
		color: var(--color-subtle);
	}
	.tag button:hover {
		color: var(--color-ink);
	}
	.privacy {
		display: flex;
		gap: 10px;
		padding: 14px 16px;
		background: var(--color-sand);
		border: 1px solid var(--color-line);
		border-radius: 2px;
		font-size: 13px;
		line-height: 1.55;
		color: var(--color-ink-3);
	}
	.settle {
		animation: pageIn 800ms var(--ease-out) backwards;
	}
	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
		}
	}
</style>
