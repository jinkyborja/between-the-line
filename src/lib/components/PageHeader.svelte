<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let {
		title,
		eyebrow,
		lede,
		privacy,
		actions,
		titleSnippet
	}: {
		title?: string;
		eyebrow?: string;
		lede?: string;
		/** Shows the dark "private" pill above the title. */
		privacy?: string;
		actions?: Snippet;
		/** Use instead of `title` when the title needs markup (e.g. italics). */
		titleSnippet?: Snippet;
	} = $props();
</script>

<!-- Shared page header: one rhythm for every page. -->
<header class="page-head">
	<div class="flex min-w-0 flex-col gap-3">
		{#if privacy}<span class="privacy-pill"><Icon name="lock" size={14} />{privacy}</span>{/if}
		{#if eyebrow}<p class="eyebrow m-0 text-xs text-subtle">{eyebrow}</p>{/if}
		<h1 class="page-title">{#if titleSnippet}{@render titleSnippet()}{:else}{title}{/if}</h1>
		{#if lede}<p class="page-lede">{lede}</p>{/if}
	</div>
	{#if actions}<div class="flex flex-wrap gap-2.5">{@render actions()}</div>{/if}
</header>
