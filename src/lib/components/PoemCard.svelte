<script lang="ts">
	import BookmarkButton from './BookmarkButton.svelte';
	import { excerpt } from '#lib/poem.ts';
	import type { CardPoem } from '#lib/types.ts';

	let {
		poem,
		saved,
		ontoggle,
		delay = 0,
		footer
	}: {
		poem: CardPoem;
		saved?: boolean;
		ontoggle?: () => void;
		delay?: number;
		footer?: string;
	} = $props();
</script>

<article
	class="card rise relative flex flex-col gap-3.5 rounded-xs border border-line bg-sheet p-7"
	style="animation-delay: {delay}ms"
>
	<div class="flex min-h-6 items-center justify-between">
		<span class="eyebrow tracking-[0.16em] text-rose">{poem.category} · {poem.kind === 'quote' ? 'Quote' : 'Poem'}</span>
		{#if ontoggle}<BookmarkButton saved={!!saved} title={poem.title} onclick={ontoggle} />{/if}
	</div>
	<a class="ttl font-serif text-[25px] leading-tight text-ink" href="/read/{poem.slug}">{poem.title}</a>
	<p class="m-0 flex-1 font-serif text-[17px] leading-[1.65] whitespace-pre-line text-ink-3">
		{poem.kind === 'quote' ? `“${poem.body}”` : excerpt(poem.body, 4).split('\n\n')[0]}
	</p>
	<div class="flex justify-between gap-3 text-[13px] text-muted">
		<span>— {poem.author}</span>{#if footer}<span>{footer}</span>{/if}
	</div>
</article>

<style>
	.ttl {
		transition: color var(--t3) var(--ease-out);
	}
	.ttl::after {
		/* whole card is clickable via the title link, bookmark stays on top */
		content: '';
		position: absolute;
		inset: 0;
	}
	.card:hover .ttl {
		color: var(--color-rose-dark);
	}
	article :global(.bm) {
		position: relative;
		z-index: 1;
	}
</style>
