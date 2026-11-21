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

	const isQuote = $derived(poem.kind === 'quote');
</script>

<!-- One card for poems and quotes: category → title → lines → author. -->
<article class="pcard surface rise" class:quote={isQuote} style="animation-delay: {delay}ms">
	<div class="flex min-h-6 items-center justify-between gap-3">
		<span class="eyebrow tracking-[0.16em] text-rose">{poem.category}{isQuote ? ' · Quote' : ''}</span>
		{#if ontoggle}<BookmarkButton saved={!!saved} title={poem.title} onclick={ontoggle} />{/if}
	</div>

	{#if isQuote}
		<span class="qmark" aria-hidden="true">“</span>
		<a class="ttl lines quote-text" href="/read/{poem.slug}">{poem.body}</a>
	{:else}
		<a class="ttl font-serif text-[24px] leading-tight text-ink" href="/read/{poem.slug}">{poem.title}</a>
		<p class="lines m-0 font-serif text-[17px] leading-[1.65] whitespace-pre-line text-ink-3">{excerpt(poem.body, 4).split('\n\n')[0]}</p>
	{/if}

	<div class="foot">
		<span class="text-ink-3">{poem.author}</span>
		{#if footer}<span>{footer}</span>{/if}
	</div>
</article>

<style>
	.pcard {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 24px;
		transition:
			border-color var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out),
			transform var(--t3) var(--ease-out);
	}
	.pcard:hover {
		border-color: var(--color-line-hover);
		box-shadow: var(--shadow-raised);
		transform: translateY(-2px);
	}
	.pcard.quote {
		background: var(--color-sand-2);
	}
	.lines {
		flex: 1;
		display: -webkit-box;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.qmark {
		height: 22px;
		font: 400 56px/1 var(--font-serif);
		color: var(--color-dusty);
	}
	.quote-text {
		font: italic 400 20px/1.5 var(--font-serif);
		color: var(--color-ink);
	}
	.ttl {
		transition: color var(--t3) var(--ease-out);
	}
	.ttl::after {
		/* the whole card is clickable via its link; the bookmark stays on top */
		content: '';
		position: absolute;
		inset: 0;
	}
	.pcard:hover .ttl {
		color: var(--color-rose-dark);
	}
	.foot {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--color-line-soft);
		font-size: 13px;
		color: var(--color-subtle);
	}
	article :global(.bm) {
		position: relative;
		z-index: 1;
	}
	@media (prefers-reduced-motion: reduce) {
		.pcard:hover {
			transform: none;
		}
	}
</style>
