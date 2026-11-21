<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		saved,
		title,
		onclick,
		withText = false
	}: { saved: boolean; title: string; onclick: () => void; withText?: boolean } = $props();
</script>

<button
	type="button"
	class="bm"
	class:on={saved}
	class:wide={withText}
	aria-pressed={saved}
	aria-label={saved ? `Remove ${title} from bookmarks` : `Bookmark ${title}`}
	{onclick}
>
	<span class="ico"><Icon name="bookmark" size={withText ? 20 : 18} filled={saved} /></span>
	{#if withText}<span>{saved ? 'Saved' : 'Save'}</span>{/if}
</button>

<style>
	.bm {
		min-width: 44px;
		height: 44px;
		padding: 0 12px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: -10px -10px -10px 0;
		border: 1px solid transparent;
		border-radius: 2px;
		background: transparent;
		color: var(--color-subtle);
		font: 500 13px var(--font-sans);
		transition:
			border-color var(--t2) var(--ease-out),
			background-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out);
	}
	.bm.wide {
		margin: 0;
		color: var(--color-body);
	}
	.bm:hover {
		color: var(--color-ink);
		border-color: var(--color-line-strong);
	}
	.bm.on {
		color: var(--color-rose);
	}
	.bm.on.wide {
		background: var(--color-rose-tint);
		border-color: var(--color-rose-soft);
	}
	.bm.on .ico {
		animation: bmPop var(--t3) var(--ease-out);
	}
	.ico {
		display: inline-flex;
	}
	@keyframes bmPop {
		45% {
			transform: scale(1.1);
		}
	}
</style>
