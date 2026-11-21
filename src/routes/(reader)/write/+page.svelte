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

	let save = $state<'idle' | 'saving' | 'saved' | 'error'>(seed ? 'saved' : 'idle');
	let dirty = false;
	let banner = $state<string | null>(null);
	let focused = $state(false);
	let typing = $state(false);
	let bodyEl = $state<HTMLTextAreaElement>();

	const poem = $derived(data.poem);
	const prompts = $derived(poem?.reflection_prompts.length ? [...poem.reflection_prompts, ...DEFAULT_PROMPTS].slice(0, 4) : poem ? DEFAULT_PROMPTS : FREE_PROMPTS);
	let promptIndex = $state(0);
	const words = $derived(body.trim() ? body.trim().split(/\s+/).length : 0);
	const excerptLines = $derived(poem ? (stanzas(poem.body).at(-2) ?? stanzas(poem.body)[0] ?? []).join('\n') : '');
	const backHref = $derived(poem && !seed ? `/read/${poem.slug}` : '/journal');

	// ---- Autosave -------------------------------------------------------
	let timer: ReturnType<typeof setTimeout>;
	let idleTimer: ReturnType<typeof setTimeout>;
	let inflight: Promise<void> = Promise.resolve();

	function touch() {
		dirty = true;
		banner = null;
		typing = true;
		save = 'saving';
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
			save = dirty ? 'saving' : 'saved';
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

	const saveLabel = $derived(
		save === 'saving' ? 'Saving…' : save === 'error' ? 'Not saved — retrying when you type' : save === 'saved' ? 'Saved privately' : 'Private · autosaves as you write'
	);
</script>

<svelte:head><title>{title || 'New reflection'} — Between the Lines</title></svelte:head>

<div class="flex min-h-screen flex-col bg-paper">
	<!-- Studio bar -->
	<header class="sticky top-0 z-5 border-b border-line bg-paper">
		<div class="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
			<a class="ctl" href={backHref}><Icon name="close" size={18} />Close</a>
			<div class="flex items-center gap-5 text-[13px]">
				<span role="status" aria-live="polite" class="inline-flex items-center gap-2 {save === 'error' ? 'text-danger' : 'text-subtle'}">
					{#if save === 'saving'}<span class="pulse size-1.5 rounded-full bg-[#8B7B6B]"></span>
					{:else if save === 'saved'}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-1 9z" /><path d="m9.5 13.5 2 2 3.5-3.5" /></svg>
					{:else}<Icon name="lock" size={14} />{/if}
					<span class="hidden sm:inline">{saveLabel}</span>
				</span>
				<span class="text-subtle">{words} {words === 1 ? 'word' : 'words'}</span>
			</div>
			<button class="btn btn-primary" onclick={() => finish('saved')} disabled={!title.trim() && !body.trim()}>Save to journal</button>
		</div>
	</header>

	{#if banner}
		<div class="fade bg-ink-2 p-3.5 text-center text-sm text-cream-2" role="status">
			{banner} <a href="/journal" class="ml-2 font-medium text-[#E8C9C4] hover:text-cream">Open My Journal</a>
		</div>
	{/if}

	<div class="mx-auto flex w-full max-w-[1360px] flex-1 flex-wrap items-start gap-10 px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
		<!-- Left: the poem + prompts -->
		<aside class="side flex max-w-full min-w-0 flex-[1_1_280px] flex-col gap-8 lg:max-w-[340px]" class:quiet={typing}>
			{#if poem}
				<div class="settle flex flex-col gap-3.5 border border-line bg-sheet p-7">
					<span class="eyebrow text-rose">Reflecting on</span>
					<a href="/read/{poem.slug}" class="font-serif text-2xl text-ink">{poem.title}</a>
					<p class="m-0 font-serif text-base leading-[1.7] whitespace-pre-line text-ink-3">{poem.kind === 'quote' ? `“${poem.body}”` : excerptLines}</p>
					<span class="text-[13px] text-muted">— {poem.author}</span>
				</div>
			{/if}
			<div class="late flex flex-col gap-1.5">
				<span class="eyebrow px-4 pb-2 text-subtle">If you’re not sure where to begin</span>
				{#each prompts as p, i (p)}
					<button class="prompt" aria-pressed={promptIndex === i} onclick={() => usePrompt(i)}>{p}</button>
				{/each}
			</div>
		</aside>

		<!-- Centre: the sheet -->
		<main class="flex min-w-0 flex-[999_1_520px] flex-col">
			<div class="sheet flex min-h-[560px] flex-col gap-5 border border-line bg-sheet px-6 pt-10 pb-10 sm:min-h-[760px] sm:px-16 sm:pt-14 sm:pb-12" class:focus={focused}>
				<p class="m-0 font-serif text-xl text-rose italic">{prompts[promptIndex]}</p>
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
					class="border-0 bg-transparent p-0 font-serif text-[32px] font-light tracking-[-0.02em] text-ink outline-none placeholder:text-faint sm:text-[40px]"
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
					class="ruled min-h-[420px] flex-1 resize-none border-0 bg-transparent p-0 font-serif text-[19px] leading-[1.8] text-[#2E2622] outline-none placeholder:text-faint sm:min-h-[520px] sm:text-[21px]"
				></textarea>
			</div>
		</main>

		<!-- Right: privacy + mood + tags -->
		<aside class="side flex max-w-full min-w-0 flex-[1_1_280px] flex-col gap-8 lg:max-w-[340px]" class:quiet={typing}>
			<div class="flex flex-col gap-2.5">
				<span class="eyebrow pb-3 text-subtle">Who can read this</span>
				<div class="opt on">
					<span class="inline-flex size-9 flex-none items-center justify-center rounded-full bg-espresso text-cream"><Icon name="lock" size={18} /></span>
					<span class="flex flex-col gap-1"><span class="text-sm font-semibold text-ink">Only me</span><span class="text-[13px] leading-normal text-muted">Kept in My Journal. Never shown to anyone — not even moderators.</span></span>
				</div>
				<a class="opt" href="/community/new{poem ? `?poem=${poem.slug}` : ''}">
					<span class="inline-flex size-9 flex-none items-center justify-center rounded-full bg-[#EAE3D9] text-body"><Icon name="community" size={18} /></span>
					<span class="flex flex-col gap-1"><span class="text-sm font-semibold text-ink">Share something anonymously</span><span class="text-[13px] leading-normal text-muted">A separate post you write for the community. This entry stays private.</span></span>
				</a>
			</div>

			<div class="flex flex-col gap-3">
				<span class="eyebrow text-subtle">How does it feel? <span class="font-medium tracking-normal normal-case">(optional, private)</span></span>
				<div class="flex flex-wrap gap-2">
					{#each MOODS as m (m)}
						<button class="mood" aria-pressed={moods.includes(m)} onclick={() => toggleMood(m)}>{m[0].toUpperCase() + m.slice(1)}</button>
					{/each}
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<label for="tag" class="eyebrow text-subtle">Tags <span class="font-medium tracking-normal normal-case">(private)</span></label>
				{#if tags.length}
					<div class="flex flex-wrap gap-1.5">
						{#each tags as t (t)}
							<span class="inline-flex h-7 items-center gap-1 rounded-full bg-skel pr-1 pl-2.5 text-xs text-body">
								#{t}<button class="inline-flex size-6 items-center justify-center rounded-full border-0 bg-transparent text-subtle hover:text-ink" aria-label="Remove tag {t}" onclick={() => removeTag(t)}><Icon name="close" size={12} /></button>
							</span>
						{/each}
					</div>
				{/if}
				<form class="flex gap-2" onsubmit={(e) => { e.preventDefault(); addTag(); }}>
					<input id="tag" class="field h-10!" placeholder="e.g. family, home" bind:value={tagInput} maxlength="32" disabled={tags.length >= 12} />
					<button class="btn btn-ghost min-h-10! px-4!" disabled={!tagInput.trim()}>Add</button>
				</form>
			</div>

			<button class="btn btn-ghost" onclick={() => finish('draft')} disabled={!title.trim() && !body.trim()}>Save as draft</button>
		</aside>
	</div>
</div>

<style>
	.ctl {
		min-width: 44px;
		height: 44px;
		padding: 0 12px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid transparent;
		border-radius: 2px;
		color: var(--color-body);
		font: 500 13px var(--font-sans);
	}
	.ctl:hover {
		border-color: var(--color-line-strong);
		color: var(--color-ink);
	}
	.sheet {
		box-shadow: 0 30px 60px -48px rgb(63 50 43 / 0.5);
		transition:
			border-color var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out),
			background-color var(--t3) var(--ease-out);
	}
	.sheet.focus {
		border-color: #d9c9b5;
		background-color: #fefcf8;
		box-shadow:
			0 0 0 4px rgb(217 179 174 / 0.16),
			0 40px 80px -52px rgb(63 50 43 / 0.55);
	}
	.side {
		transition: opacity var(--t4) var(--ease-out);
	}
	.side.quiet {
		opacity: 0.55;
	}
	.side.quiet:hover,
	.side.quiet:focus-within {
		opacity: 1;
	}
	.prompt {
		width: 100%;
		text-align: left;
		padding: 14px 16px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 2px;
		font: italic 400 17px/1.45 var(--font-serif);
		color: var(--color-body);
		transition:
			background-color var(--t2) var(--ease-out),
			border-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out);
	}
	.prompt:hover,
	.prompt[aria-pressed='true'] {
		background: var(--color-card);
		border-color: var(--color-line);
		color: var(--color-ink);
	}
	.opt {
		width: 100%;
		display: flex;
		gap: 14px;
		align-items: flex-start;
		padding: 16px;
		background: var(--color-card);
		border: 1px solid var(--color-line);
		border-radius: 2px;
		color: inherit;
		transition: border-color var(--t2) var(--ease-out);
	}
	a.opt:hover {
		border-color: var(--color-faint);
	}
	.opt.on {
		border-color: var(--color-espresso);
		box-shadow: inset 0 0 0 1px var(--color-espresso);
		background: var(--color-sheet);
	}
	.mood {
		min-height: 34px;
		padding: 0 12px;
		border-radius: 999px;
		border: 1px solid var(--color-line-strong);
		background: transparent;
		font: 500 12px var(--font-sans);
		color: var(--color-body);
		transition: all var(--t2) var(--ease-out);
	}
	.mood:hover {
		border-color: #8b7b6b;
	}
	.mood[aria-pressed='true'] {
		background: var(--color-rose-tint);
		border-color: var(--color-rose-soft);
		color: var(--color-rose-dark);
	}
	.pulse {
		animation: pulse 1.6s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
	.settle {
		animation: pageIn 900ms var(--ease-out) backwards;
	}
	.late {
		animation: pageIn var(--t4) var(--ease-out) 320ms backwards;
	}
	.fade {
		animation: pageIn var(--t3) var(--ease-out) both;
	}
</style>
