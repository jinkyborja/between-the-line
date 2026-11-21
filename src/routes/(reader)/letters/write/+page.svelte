<script lang="ts">
	import { beforeNavigate, goto, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, untrack } from 'svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { LETTER_KINDS, kindOf, longDate } from '#lib/letters.ts';
	import type { LetterKind } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Seed editor state once from the loaded letter.
	const seed = untrack(() => data.letter);
	let id = $state<string | null>(seed?.id ?? null);
	let kind = $state<LetterKind>(untrack(() => data.kind));
	let recipient = $state(seed?.recipient ?? '');
	let title = $state(seed?.title ?? '');
	let body = $state(seed?.body ?? '');
	let status = $state<'draft' | 'complete'>(seed?.status ?? 'draft');
	let archived = $state(!!seed?.archived_at);
	let remindOn = $state(seed?.remind_on ?? '');
	const createdAt = seed?.created_at ?? new Date().toISOString();

	let save = $state<'idle' | 'saving' | 'saved' | 'error'>(seed ? 'saved' : 'idle');
	let dirty = false;
	let sealed = $state(false);
	let focused = $state(false);
	let showPrompts = $state(!seed);
	let confirmDelete = $state(false);
	let bodyEl = $state<HTMLTextAreaElement>();

	const meta = $derived(kindOf(kind));
	const words = $derived(body.trim() ? body.trim().split(/\s+/).length : 0);
	const tomorrow = new Date(Date.now() + 864e5).toISOString().slice(0, 10);

	// ---- Autosave (same calm rhythm as the journal) ---------------------------
	let timer: ReturnType<typeof setTimeout>;
	let inflight: Promise<void> = Promise.resolve();

	function touch() {
		dirty = true;
		sealed = false;
		save = 'saving';
		clearTimeout(timer);
		timer = setTimeout(flush, 900);
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
				kind,
				recipient: kind === 'unsent' ? recipient.trim() || null : null,
				title: title.trim() || null,
				body,
				status,
				remind_on: kind === 'future' && remindOn ? remindOn : null
			};
			// user_id comes from the database default and is enforced by RLS.
			const res = id
				? await data.supabase.from('letters').update(row).eq('id', id).select('id').single()
				: await data.supabase.from('letters').insert(row).select('id').single();
			if (res.error) {
				dirty = true;
				save = 'error';
				return;
			}
			if (!id) {
				id = res.data.id as string;
				const u = new URL(page.url.href);
				u.searchParams.set('id', id);
				u.searchParams.delete('kind');
				replaceState(u, {});
			}
			save = dirty ? 'saving' : 'saved';
		});
		return inflight;
	}

	async function finish(next: 'draft' | 'complete') {
		status = next;
		dirty = true;
		await flush();
		if (save === 'saved' && next === 'complete') sealed = true;
	}

	async function toggleArchive() {
		if (!id) return;
		await flush();
		const value = archived ? null : new Date().toISOString();
		const { error } = await data.supabase.from('letters').update({ archived_at: value }).eq('id', id);
		if (!error) archived = !archived;
	}

	async function doDelete() {
		if (!id) return goto('/letters');
		const { error } = await data.supabase.from('letters').delete().eq('id', id);
		if (!error) {
			dirty = false;
			goto('/letters');
		}
	}

	function pickKind(k: LetterKind) {
		if (k === kind) return;
		kind = k;
		if (k !== 'future') remindOn = '';
		touch();
	}

	function usePrompt(p: string) {
		if (!body.trim()) body = '';
		showPrompts = false;
		bodyEl?.focus();
		bodyEl?.setAttribute('placeholder', p);
	}

	beforeNavigate(({ willUnload, cancel, to }) => {
		if (!dirty && save !== 'saving') return;
		if (willUnload) return cancel();
		if (to) flush();
	});
	onMount(() => () => clearTimeout(timer));

	// Let the letter grow with its words instead of scrolling inside itself.
	$effect(() => {
		void body;
		if (!bodyEl) return;
		bodyEl.style.height = 'auto';
		bodyEl.style.height = Math.max(bodyEl.scrollHeight, 360) + 'px';
	});

	const saveLabel = $derived(
		save === 'saving' ? 'Saving…' : save === 'error' ? 'Not saved — will retry' : save === 'saved' ? 'Kept privately' : 'Private · saves as you write'
	);
</script>

<svelte:head><title>{title || meta.label} — Between the Lines</title></svelte:head>

<div class="desk flex min-h-screen flex-col">
	<!-- Bar -->
	<header class="sticky top-0 z-5 border-b border-line bg-[rgb(247_242_234/0.92)] backdrop-blur">
		<div class="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
			<a class="ctl" href="/letters"><Icon name="close" size={18} />Letters</a>
			<div class="flex items-center gap-5 text-[13px]">
				<span role="status" aria-live="polite" class="inline-flex items-center gap-2 {save === 'error' ? 'text-danger' : 'text-subtle'}">
					{#if save === 'saving'}<span class="pulse size-1.5 rounded-full bg-[#8B7B6B]"></span>{:else}<Icon name="lock" size={14} />{/if}
					<span class="hidden sm:inline">{saveLabel}</span>
				</span>
				<span class="text-subtle">{words} {words === 1 ? 'word' : 'words'}</span>
			</div>
			<button class="btn btn-primary" onclick={() => finish('complete')} disabled={!body.trim()}>
				<Icon name="envelope" size={17} />{status === 'complete' ? 'Seal again' : 'Finish letter'}
			</button>
		</div>
	</header>

	<div class="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-8 px-4 pt-8 pb-20 sm:px-6 sm:pt-10">
		<!-- Who is this letter for? -->
		<div role="radiogroup" aria-label="Who is this letter for?" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{#each LETTER_KINDS as k (k.kind)}
				<button role="radio" aria-checked={kind === k.kind} class="kind" onclick={() => pickKind(k.kind)}>
					<svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M1 1h20v14H1z" /><path d="M1 1l10 7 10-7" /></svg>
					<span>{k.label}</span>
				</button>
			{/each}
		</div>

		<div class="flex flex-wrap items-start gap-8">
			<!-- The letter -->
			<main class="min-w-0 flex-[999_1_560px]">
				<article class="sheet relative" class:focus={focused}>
					{#key kind}<span class="kind-tag">{meta.label}</span>{/key}
					<p class="m-0 text-right font-serif text-[15px] text-subtle italic">{longDate(createdAt)}</p>

					<label class="sr-only" for="lt">Title (only you will see it)</label>
					<input id="lt" class="title" type="text" maxlength="160" placeholder="A title, if it has one" bind:value={title} oninput={touch} onfocus={() => (focused = true)} onblur={() => (focused = false)} />

					{#if kind === 'unsent'}
						<p class="salute m-0 flex flex-wrap items-baseline gap-2">
							<label for="to">Dear</label>
							<input id="to" class="to" type="text" maxlength="80" placeholder="someone" bind:value={recipient} oninput={touch} />,
						</p>
					{:else}
						<p class="salute m-0">{meta.salutation}</p>
					{/if}

					<label class="sr-only" for="lb">Your letter</label>
					<textarea
						id="lb"
						bind:this={bodyEl}
						bind:value={body}
						oninput={touch}
						onfocus={() => (focused = true)}
						onblur={() => (focused = false)}
						maxlength="50000"
						placeholder="Begin wherever you are."
						class="body"
					></textarea>

					<p class="signoff m-0">— me</p>

					{#if sealed}
						<div class="seal" role="status">
							<span class="wax" aria-hidden="true"><Icon name="envelope" size={22} /></span>
							<span>Sealed and kept safe. Only you can open it.</span>
						</div>
					{/if}
				</article>
			</main>

			<!-- Margin notes -->
			<aside class="flex min-w-0 flex-[1_1_260px] flex-col gap-7 lg:max-w-[300px]">
				<div class="flex flex-col gap-2">
					<button class="eyebrow flex items-center justify-between border-0 bg-transparent p-0 text-left text-subtle" aria-expanded={showPrompts} onclick={() => (showPrompts = !showPrompts)}>
						If you’re not sure how to begin <span class="chev" class:up={showPrompts} aria-hidden="true">⌄</span>
					</button>
					{#if showPrompts}
						<ul class="prompts m-0 flex list-none flex-col gap-1 p-0">
							{#each meta.prompts as p (p)}<li><button class="prompt" onclick={() => usePrompt(p)}>{p}</button></li>{/each}
						</ul>
					{/if}
				</div>

				{#if kind === 'future'}
					<div class="note flex flex-col gap-2.5">
						<label for="open" class="eyebrow text-subtle">Remind me to open it <span class="font-medium tracking-normal normal-case">(optional)</span></label>
						<input id="open" class="field" type="date" min={tomorrow} bind:value={remindOn} onchange={touch} />
						<p class="m-0 text-xs leading-relaxed text-muted">
							{remindOn ? `On ${longDate(remindOn)} you’ll find a quiet note in Notifications.` : 'Pick a day, and we’ll leave you a quiet note in Notifications when it arrives.'}
						</p>
						{#if remindOn}<button class="self-start border-0 bg-transparent p-0 text-xs text-subtle underline" onclick={() => { remindOn = ''; touch(); }}>Remove reminder</button>{/if}
					</div>
				{/if}

				<div class="note flex gap-2.5 text-[13px] leading-[1.55] text-ink-3">
					<span class="mt-0.5"><Icon name="lock" size={15} /></span>
					<span>Letters are never shared, never shown in the community, and can’t be read by anyone else — not even moderators.</span>
				</div>

				<div class="flex flex-col gap-2">
					<button class="btn btn-ghost" onclick={() => finish('draft')} disabled={!title.trim() && !body.trim()}>Keep as draft</button>
					{#if id}
						<button class="btn btn-ghost" onclick={toggleArchive}><Icon name="archive" size={16} />{archived ? 'Unarchive' : 'Archive letter'}</button>
						<button class="btn btn-ghost border-transparent! text-danger!" onclick={() => (confirmDelete = true)}><Icon name="trash" size={16} />Delete</button>
					{/if}
				</div>
				{#if seed}
					<p class="m-0 text-xs text-subtle">Written {longDate(seed.created_at)} · last edited {longDate(seed.updated_at)}</p>
				{/if}
			</aside>
		</div>
	</div>
</div>

<ConfirmDialog open={confirmDelete} title="Let this letter go?" confirmLabel="Delete letter" cancelLabel="Keep it" danger onconfirm={doDelete} oncancel={() => (confirmDelete = false)}>
	It will be deleted for good. If you only want it out of sight, archive it instead.
</ConfirmDialog>

<style>
	.desk {
		background: var(--color-paper);
	}
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

	/* Kind selector — four small envelopes. */
	.kind {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 48px;
		padding: 0 14px;
		border: 1px solid var(--color-line);
		border-radius: 2px;
		background: var(--color-card);
		color: var(--color-body);
		font: 500 13px var(--font-sans);
		text-align: left;
		transition: border-color var(--t2) var(--ease-out), background-color var(--t2) var(--ease-out), color var(--t2) var(--ease-out);
	}
	.kind:hover {
		border-color: var(--color-faint);
	}
	.kind[aria-checked='true'] {
		border-color: var(--color-espresso);
		box-shadow: inset 0 0 0 1px var(--color-espresso);
		background: #fdf9f1;
		color: var(--color-ink);
	}
	:global([data-theme='dark']) .kind[aria-checked='true'] {
		background: #2a231e;
	}

	/* The sheet: ivory stationery, ruled lines, a faint margin rule. */
	.sheet {
		--rule: 36px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		padding: 56px 28px 48px 52px;
		background-color: #fdf9f1;
		background-image:
			linear-gradient(90deg, transparent 36px, rgb(164 90 94 / 0.22) 36px, rgb(164 90 94 / 0.22) 37px, transparent 37px),
			radial-gradient(rgb(63 50 43 / 0.03) 1px, transparent 1px);
		background-size: 100% 100%, 3px 3px;
		border: 1px solid var(--color-line);
		box-shadow:
			0 1px 0 #fff inset,
			0 30px 60px -46px rgb(63 50 43 / 0.55),
			6px 8px 0 -2px #efe6d9,
			6px 8px 0 -1px var(--color-line);
		animation: settle 820ms var(--ease-out) both;
		transition: box-shadow var(--t3) var(--ease-out), border-color var(--t3) var(--ease-out);
	}
	@media (min-width: 640px) {
		.sheet {
			padding: 72px 72px 60px 88px;
			background-image:
				linear-gradient(90deg, transparent 64px, rgb(164 90 94 / 0.22) 64px, rgb(164 90 94 / 0.22) 65px, transparent 65px),
				radial-gradient(rgb(63 50 43 / 0.03) 1px, transparent 1px);
		}
	}
	.sheet.focus {
		border-color: #d9c9b5;
		box-shadow:
			0 0 0 4px rgb(217 179 174 / 0.14),
			0 40px 80px -52px rgb(63 50 43 / 0.55),
			6px 8px 0 -2px #efe6d9,
			6px 8px 0 -1px var(--color-line);
	}
	:global([data-theme='dark']) .sheet {
		background-color: #2a231e;
		background-image:
			linear-gradient(90deg, transparent 64px, rgb(217 163 163 / 0.18) 64px, rgb(217 163 163 / 0.18) 65px, transparent 65px),
			radial-gradient(rgb(255 255 255 / 0.02) 1px, transparent 1px);
		box-shadow: 0 30px 60px -46px rgb(0 0 0 / 0.7), 6px 8px 0 -2px #221c18, 6px 8px 0 -1px var(--color-line);
	}
	@keyframes settle {
		from {
			opacity: 0;
			transform: translateY(10px) rotate(-0.3deg);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
	.kind-tag {
		position: absolute;
		top: 20px;
		left: 52px;
		font: 600 10px var(--font-sans);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--color-rose);
		animation: pageIn var(--t3) var(--ease-out) both;
	}
	@media (min-width: 640px) {
		.kind-tag {
			left: 88px;
			top: 28px;
		}
	}
	.title {
		margin-top: 6px;
		border: 0;
		background: transparent;
		padding: 0;
		outline: none;
		font: 300 34px/1.15 var(--font-serif);
		letter-spacing: -0.02em;
		color: var(--color-ink);
	}
	.title::placeholder,
	.to::placeholder,
	.body::placeholder {
		color: var(--color-faint);
	}
	.salute {
		margin-top: 18px;
		font: italic 400 22px/1.6 var(--font-serif);
		color: var(--color-ink-3);
	}
	.to {
		min-width: 0;
		width: 12ch;
		flex: 0 1 auto;
		border: 0;
		border-bottom: 1px dashed var(--color-line-strong);
		background: transparent;
		padding: 0 2px;
		outline: none;
		font: italic 400 22px/1.4 var(--font-serif);
		color: var(--color-ink);
	}
	.to:focus {
		border-bottom-color: var(--color-rose);
	}
	/* Ruled writing lines that scroll with the text. */
	.body {
		min-height: 360px;
		resize: none;
		overflow: hidden;
		border: 0;
		padding: 0;
		outline: none;
		font: 400 20px/var(--rule) var(--font-serif);
		color: #2e2622;
		background-color: transparent;
		background-image: linear-gradient(transparent calc(var(--rule) - 1px), rgb(63 50 43 / 0.09) calc(var(--rule) - 1px));
		background-size: 100% var(--rule);
		background-attachment: local;
	}
	:global([data-theme='dark']) .body {
		color: var(--color-ink-2);
		background-image: linear-gradient(transparent calc(var(--rule) - 1px), rgb(255 255 255 / 0.06) calc(var(--rule) - 1px));
	}
	@media (min-width: 640px) {
		.sheet {
			--rule: 38px;
		}
		.body {
			font-size: 21px;
		}
	}
	.signoff {
		align-self: flex-end;
		margin-top: 8px;
		font: italic 400 22px var(--font-serif);
		color: var(--color-ink-3);
	}

	/* Sealing: a wax seal settles onto the letter. Slow, soft, no bounce. */
	.seal {
		align-self: center;
		margin-top: 20px;
		display: flex;
		align-items: center;
		gap: 14px;
		font: italic 400 16px var(--font-serif);
		color: var(--color-muted);
		animation: pageIn 600ms var(--ease-out) 200ms both;
	}
	.wax {
		width: 54px;
		height: 54px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #f8ecea;
		background: radial-gradient(circle at 35% 30%, #a85a60, #8e4a4f 55%, #6e363b);
		box-shadow: 0 6px 14px -6px rgb(110 54 59 / 0.6), inset 0 0 0 4px rgb(255 255 255 / 0.08);
		animation: press 700ms var(--ease-out) both;
	}
	@keyframes press {
		from {
			opacity: 0;
			transform: scale(1.18) rotate(-12deg);
		}
		to {
			opacity: 1;
			transform: rotate(-6deg);
		}
	}

	.note {
		padding: 16px;
		border: 1px solid var(--color-line);
		background: var(--color-card);
	}
	.prompt {
		width: 100%;
		text-align: left;
		padding: 12px 14px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 2px;
		font: italic 400 16px/1.45 var(--font-serif);
		color: var(--color-body);
		transition: background-color var(--t2) var(--ease-out), border-color var(--t2) var(--ease-out), color var(--t2) var(--ease-out);
	}
	.prompt:hover {
		background: var(--color-card);
		border-color: var(--color-line);
		color: var(--color-ink);
	}
	.prompts {
		animation: pageIn var(--t3) var(--ease-out);
	}
	.chev {
		display: inline-block;
		transition: transform var(--t2) var(--ease-out);
	}
	.chev.up {
		transform: rotate(180deg);
	}
	.pulse {
		animation: pulse 1.6s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sheet,
		.wax,
		.seal,
		.kind-tag {
			animation: none;
		}
	}
</style>
