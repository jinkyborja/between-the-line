<script lang="ts">
	import { onMount } from 'svelte';
	import BookmarkButton from '#lib/components/BookmarkButton.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { setBookmark } from '#lib/bookmarks.ts';
	import { stanzas } from '#lib/poem.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const SIZES = { S: '19px', M: '21px', L: '24px' } as const;
	type Size = keyof typeof SIZES;
	let size = $derived<Size>(data.textSize as Size);
	let saved = $derived(data.saved);
	let progress = $state(0);

	const toast = createToast();
	const poem = $derived(data.poem);
	const isQuote = $derived(poem.kind === 'quote');

	// Each line rises 90ms after the one before it.
	const lines = $derived.by(() => {
		let n = 0;
		return stanzas(poem.body).map((st, i, all) => ({
			last: i === all.length - 1 && all.length > 1,
			lines: st.map((text) => ({ text, delay: 300 + 90 * n++ }))
		}));
	});
	const afterDelay = $derived(Math.min(300 + 90 * lines.flatMap((s) => s.lines).length + 300, 2600));

	onMount(() => {
		const onScroll = () => {
			const d = document.documentElement;
			const max = d.scrollHeight - innerHeight;
			progress = max > 0 ? Math.round((scrollY / max) * 100) : 100;
		};
		onScroll();
		addEventListener('scroll', onScroll, { passive: true });
		return () => removeEventListener('scroll', onScroll);
	});

	async function setSize(s: Size) {
		if (s === size) return;
		size = s;
		// Remembered on the private profile (RLS: own row only).
		if (data.session?.user) await data.supabase.from('profiles').update({ text_size: s }).eq('id', data.session.user.id);
	}

	async function toggleBm() {
		const on = !saved;
		saved = on;
		if (!(await setBookmark(data.supabase, poem.id, on))) {
			saved = !on;
			toast.show('That didn’t save. Please try again.');
			return;
		}
		toast.show(on ? 'Saved to Bookmarks.' : 'Removed from Bookmarks.', async () => {
			saved = !on;
			await setBookmark(data.supabase, poem.id, !on);
		});
	}

	// Shares only the poem's link — nothing about the reader.
	async function share() {
		const url = location.href.split('#')[0];
		try {
			if (navigator.share) return await navigator.share({ title: poem.title, text: `“${poem.title}” — ${poem.author}`, url });
			await navigator.clipboard.writeText(url);
			toast.show('Link copied.');
		} catch (e) {
			if ((e as Error)?.name !== 'AbortError') toast.show('Couldn’t share the link just now.');
		}
	}
</script>

<svelte:head><title>{poem.title} — Between the Lines</title></svelte:head>

<div class="page-in min-h-screen bg-sheet">
	<!-- Reading bar + progress -->
	<header class="bar sticky top-0 z-5 border-b border-line-soft">
		<div class="mx-auto flex max-w-[1240px] items-center justify-between gap-2 px-3 py-2 sm:px-6">
			<a class="btn btn-quiet btn-sm" href="/library"><Icon name="back" size={17} />Library</a>
			<div class="flex items-center gap-1">
				<div role="radiogroup" aria-label="Text size" class="sizes">
					{#each Object.keys(SIZES) as s (s)}
						<button role="radio" aria-checked={size === s} aria-label={{ S: 'Small', M: 'Medium', L: 'Large' }[s]} onclick={() => setSize(s as Size)}>
							<span style="font-size: {{ S: 13, M: 16, L: 19 }[s]}px">A</span>
						</button>
					{/each}
				</div>
				<button class="icon-btn" aria-label="Share this poem" title="Share" onclick={share}><Icon name="share" size={18} /></button>
				<BookmarkButton {saved} title={poem.title} onclick={toggleBm} withText />
			</div>
		</div>
		<div role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} class="h-0.5 bg-sand">
			<div class="h-0.5 bg-dusty transition-[width] duration-200 ease-linear" style="width: {progress}%"></div>
		</div>
	</header>

	<!-- The poem -->
	<article class="mx-auto flex max-w-[640px] flex-col gap-11 px-6 pt-14 pb-16 sm:px-8 sm:pt-24">
		<header class="reveal-title flex flex-col items-start gap-4">
			<a href="/library?category={poem.category.slug}" class="eyebrow text-rose">{poem.category.name}{isQuote ? ' · Quote' : ''}</a>
			<h1 style="view-transition-name: poem-title" class="m-0 font-serif text-[40px] leading-[1.06] font-light tracking-[-0.025em] text-balance text-ink sm:text-[54px]">{poem.title}</h1>
			<p class="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
				<span class="font-serif text-xl text-ink-3 italic">by {poem.author}</span>
				<span class="text-[13px] text-subtle">{poem.reading_minutes} min read</span>
			</p>
		</header>

		{#if isQuote}
			<blockquote class="quote m-0" style="font-size: calc({SIZES[size]} + 6px)">
				<span class="line-in" style="animation-delay: 300ms">{poem.body}</span>
			</blockquote>
		{:else}
			<div class="poem flex flex-col gap-8" style="font-size: {SIZES[size]}">
				{#each lines as st, i (i)}
					<p class="m-0" class:italic={st.last}>
						{#each st.lines as ln, j (j)}<span class="line-in" style="animation-delay: {ln.delay}ms">{ln.text}</span>{/each}
					</p>
				{/each}
			</div>
		{/if}

		<div class="after flex justify-center pt-2 font-serif text-lg text-dusty" aria-hidden="true" style="animation-delay: {afterDelay}ms">· · ·</div>
	</article>

	<!-- Reflection -->
	<section class="after mx-auto max-w-[640px] px-5 pb-24 sm:px-8" style="animation-delay: {afterDelay}ms" aria-labelledby="reflect-h">
		<div class="reflect">
			<span class="eyebrow text-subtle">Sit with it a moment</span>
			<h2 id="reflect-h" class="m-0 font-serif text-[27px] leading-[1.3] font-light text-ink sm:text-[31px]">What did these words awaken in you?</h2>
			{#if poem.reflection_prompts.length}
				<ul class="m-0 flex list-none flex-col gap-2 p-0 font-serif text-[17px] leading-normal text-body italic">
					{#each poem.reflection_prompts as p (p)}<li>— {p}</li>{/each}
				</ul>
			{/if}
			<div class="flex flex-col gap-3 pt-2">
				<a class="btn btn-primary btn-lg self-start" href="/write?poem={poem.slug}">Write what it means to you <span class="arr"><Icon name="arrow" size={18} /></span></a>
				<p class="m-0 flex items-center gap-2 text-[13px] text-muted"><Icon name="lock" size={14} />Goes to your private journal. Nothing is shared unless you write a separate post.</p>
			</div>
			<a class="share-anon" href="/community/new?poem={poem.slug}">
				<Icon name="community" size={16} />
				<span>Want to share with the community instead? <strong>Write an anonymous post</strong></span>
			</a>
		</div>
	</section>

	<!-- Anonymous reflections from the community -->
	<section class="border-t border-line-soft bg-paper" aria-labelledby="others-h">
		<div class="mx-auto flex max-w-[880px] flex-col gap-7 px-5 pt-16 pb-28 sm:px-8 sm:pt-20">
			<div class="flex flex-wrap items-baseline justify-between gap-3">
				<h2 id="others-h" class="section-title">
					{data.reflectionCount
						? `${data.reflectionCount} ${data.reflectionCount === 1 ? 'reader' : 'readers'} reflected on this`
						: 'No one has shared about this yet'}
				</h2>
				<a href="/community" class="section-link">{data.reflectionCount ? 'Read all reflections →' : 'Visit the community →'}</a>
			</div>
			{#if data.reflections.length}
				<div class="grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-4">
					{#each data.reflections as r (r.id)}
						<article class="surface flex flex-col gap-4 p-6">
							<p class="m-0 line-clamp-6 font-serif text-[17px] leading-[1.6] whitespace-pre-line text-ink-3">{r.body}</p>
							<div class="flex justify-between border-t border-line-soft pt-3 text-[13px] text-subtle"><span>Anonymous</span><span>{r.likes_count} felt this</span></div>
						</article>
					{/each}
				</div>
			{/if}
			<nav aria-label="More in {poem.category.name}" class="grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2">
				{#if data.prev}
					<a href="/read/{data.prev.slug}" class="surface pn"><span class="text-xs text-subtle">← Previous in {poem.category.name}</span><span class="font-serif text-xl text-ink">{data.prev.title}</span></a>
				{:else}<span class="hidden sm:block"></span>{/if}
				{#if data.next}
					<a href="/read/{data.next.slug}" class="surface pn sm:text-right"><span class="text-xs text-subtle">Next in {poem.category.name} →</span><span class="font-serif text-xl text-ink">{data.next.title}</span></a>
				{/if}
			</nav>
		</div>
	</section>
</div>

<Toast open={toast.open} text={toast.text} onundo={toast.undo} />

<style>
	.bar {
		background: rgb(253 251 247 / 0.94);
		backdrop-filter: blur(8px);
	}
	:global([data-theme='dark']) .bar {
		background: rgb(35 30 27 / 0.94);
	}
	.sizes {
		display: inline-flex;
		align-items: center;
		margin-right: 4px;
		padding: 2px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
	}
	.sizes button {
		width: 34px;
		height: 34px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--color-muted);
		font-family: var(--font-serif);
		transition:
			background-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out);
	}
	.sizes button[aria-checked='true'] {
		background: var(--color-beige);
		color: var(--color-ink);
	}
	/* Comfortable measure: ~34em, generous leading, stanza gaps. */
	.poem {
		font-family: var(--font-serif);
		line-height: 1.75;
		color: var(--color-ink-2);
		transition: font-size var(--t3) var(--ease-out);
	}
	.quote {
		padding-left: 22px;
		border-left: 2px solid var(--color-dusty);
		font: italic 300 26px/1.5 var(--font-serif);
		color: var(--color-ink);
	}
	.reveal-title {
		animation: lineIn 900ms var(--ease-out) both;
	}
	.after {
		animation: pageIn var(--t4) var(--ease-out) both;
	}
	.reflect {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 28px 24px;
		background: var(--color-sand-2);
		border: 1px solid var(--color-line-soft);
		border-radius: 2px;
	}
	@media (min-width: 640px) {
		.reflect {
			padding: 44px;
		}
	}
	.share-anon {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		margin-top: 4px;
		padding-top: 16px;
		border-top: 1px solid var(--color-line);
		font-size: 14px;
		line-height: 1.5;
		color: var(--color-muted);
	}
	.share-anon strong {
		font-weight: 500;
		color: var(--color-rose);
	}
	.share-anon:hover strong {
		color: var(--color-rose-dark);
	}
	.pn {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 16px 18px;
	}
	.arr {
		display: inline-flex;
		transition: transform var(--t2) var(--ease-out);
	}
	a:hover .arr {
		transform: translateX(3px);
	}
</style>
