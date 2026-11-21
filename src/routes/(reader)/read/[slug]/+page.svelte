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

	const SIZES = { S: '20px', M: '22px', L: '25px' } as const;
	type Size = keyof typeof SIZES;
	let size = $state<Size>('M');
	let saved = $state(false);
	let progress = $state(0);
	$effect.pre(() => {
		size = data.textSize as Size;
		saved = data.saved;
	});

	const toast = createToast();
	const poem = $derived(data.poem);
	const isQuote = $derived(poem.kind === 'quote');

	// Each line staggers 90ms after the title, as in the design.
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

	async function cycleSize() {
		const order: Size[] = ['S', 'M', 'L'];
		size = order[(order.indexOf(size) + 1) % 3];
		// Remembered on the private profile (RLS: own row only).
		if (data.session?.user) await data.supabase.from('profiles').update({ text_size: size }).eq('id', data.session.user.id);
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
</script>

<svelte:head><title>{poem.title} — Between the Lines</title></svelte:head>

<div class="page-in min-h-screen bg-sheet">
	<!-- Minimal reading bar + progress -->
	<header class="sticky top-0 z-5 border-b border-line-soft bg-[rgb(253_251_247/0.94)] backdrop-blur">
		<div class="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
			<a class="ctl" href="/library"><Icon name="back" size={18} />Library</a>
			<a href="/discover" class="hidden font-serif text-[15px] text-subtle italic sm:inline">Between the Lines</a>
			<div class="flex gap-1">
				<button class="ctl" aria-label="Change text size, currently {size}" onclick={cycleSize}><span class="font-serif text-lg">A</span><span class="text-xs">{size}</span></button>
				<BookmarkButton saved={saved} title={poem.title} onclick={toggleBm} withText />
			</div>
		</div>
		<div role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} class="h-0.5 bg-sand">
			<div class="h-0.5 bg-rose transition-[width] duration-200 ease-linear" style="width: {progress}%"></div>
		</div>
	</header>

	<!-- The poem -->
	<article class="mx-auto flex max-w-[680px] flex-col gap-12 px-6 pt-16 pb-20 sm:px-7 sm:pt-[104px]">
		<header class="reveal-title flex flex-col items-start gap-5">
			<a href="/library?category={poem.category.slug}" class="eyebrow text-rose">{poem.category.name}{isQuote ? ' · Quote' : ''}</a>
			<h1 style="view-transition-name: poem-title" class="m-0 font-serif text-[42px] leading-[1.05] font-light tracking-[-0.025em] text-balance text-ink sm:text-[56px]">{poem.title}</h1>
			<p class="m-0 text-[15px] text-muted">{poem.author} <span class="text-faint">·</span> {poem.reading_minutes} min read</p>
		</header>

		<div class="flex flex-col gap-9 font-serif leading-[1.75] text-[#2E2622]" style="font-size: {SIZES[size]}">
			{#each lines as st, i (i)}
				<p class="m-0" class:italic={st.last}>
					{#each st.lines as ln, j (j)}<span class="line-in" style="animation-delay: {ln.delay}ms">{ln.text}</span>{/each}
				</p>
			{/each}
		</div>

		<div class="after flex justify-center pt-2 font-serif text-lg text-rose-soft" aria-hidden="true" style="animation-delay: {afterDelay}ms">· · ·</div>
	</article>

	<!-- Reflection continuation -->
	<section class="after mx-auto max-w-[680px] px-6 pb-24 sm:px-7" style="animation-delay: {afterDelay}ms">
		<div class="flex flex-col gap-5.5 border border-line-soft bg-sand-2 p-7 sm:p-12">
			<span class="eyebrow text-subtle">Sit with it a moment</span>
			<p class="m-0 font-serif text-[28px] leading-[1.3] font-light text-ink sm:text-[32px]">What did these words awaken in you?</p>
			{#if poem.reflection_prompts.length}
				<ul class="m-0 flex list-none flex-col gap-2.5 p-0 font-serif text-lg leading-normal text-body italic">
					{#each poem.reflection_prompts as p (p)}<li>— {p}</li>{/each}
				</ul>
			{/if}
			<div class="flex flex-wrap items-center gap-5 pt-1.5">
				<a class="btn btn-primary btn-lg" href="/write?poem={poem.slug}">Write what it means to you <span class="arr"><Icon name="arrow" size={18} /></span></a>
				<span class="inline-flex items-center gap-2 text-[13px] text-muted"><Icon name="lock" size={15} />Saved to your private journal</span>
			</div>
		</div>
	</section>

	<!-- Anonymous reflections from the community -->
	<section class="border-t border-line-soft bg-paper">
		<div class="mx-auto flex max-w-[880px] flex-col gap-7 px-6 pt-20 pb-28 sm:px-7">
			<div class="flex flex-wrap items-baseline justify-between gap-3">
				<h2 class="m-0 font-serif text-[28px] font-normal text-ink">
					{data.reflectionCount
						? `${data.reflectionCount} ${data.reflectionCount === 1 ? 'reader' : 'readers'} reflected on this`
						: 'No one has shared about this yet'}
				</h2>
				<a href="/community" class="text-sm font-medium">{data.reflectionCount ? 'Read all reflections →' : 'Visit the community →'}</a>
			</div>
			{#if data.reflections.length}
				<div class="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-5">
					{#each data.reflections as r (r.id)}
						<article class="card flex flex-col gap-4 border border-line bg-card p-7">
							<p class="m-0 line-clamp-6 font-serif text-lg leading-[1.6] whitespace-pre-line text-ink-3">{r.body}</p>
							<div class="flex justify-between border-t border-line-soft pt-3.5 text-[13px] text-muted"><span>Anonymous</span><span>{r.likes_count} felt this</span></div>
						</article>
					{/each}
				</div>
			{/if}
			<nav aria-label="More in {poem.category.name}" class="flex flex-wrap justify-between gap-4 border-t border-line pt-6">
				{#if data.prev}
					<a href="/read/{data.prev.slug}" class="flex flex-col gap-1"><span class="text-xs text-subtle">Previous in {poem.category.name}</span><span class="font-serif text-xl text-ink">{data.prev.title}</span></a>
				{:else}<span></span>{/if}
				{#if data.next}
					<a href="/read/{data.next.slug}" class="flex flex-col gap-1 text-right"><span class="text-xs text-subtle">Next in {poem.category.name}</span><span class="font-serif text-xl text-ink">{data.next.title}</span></a>
				{/if}
			</nav>
		</div>
	</section>
</div>

<Toast open={toast.open} text={toast.text} onundo={toast.undo} />

<style>
	.ctl {
		min-width: 44px;
		height: 44px;
		padding: 0 12px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid transparent;
		border-radius: 2px;
		background: transparent;
		color: var(--color-body);
		font: 500 13px var(--font-sans);
		transition:
			border-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out);
	}
	.ctl:hover {
		border-color: var(--color-line-strong);
		color: var(--color-ink);
	}
	.reveal-title {
		animation: lineIn 900ms var(--ease-out) both;
	}
	.after {
		animation: pageIn var(--t4) var(--ease-out) both;
	}
	.arr {
		display: inline-flex;
		transition: transform var(--t2) var(--ease-out);
	}
	a:hover .arr {
		transform: translateX(3px);
	}
</style>
