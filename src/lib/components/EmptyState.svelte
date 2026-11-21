<script lang="ts">
	import type { Snippet } from 'svelte';

	let { title, text, children }: { title: string; text: string; children?: Snippet } = $props();
</script>

<!-- Shared empty state: a hand-drawn ink line draws itself once, then rests. -->
<div class="rise flex flex-col items-center gap-3 border border-line bg-card px-8 py-16 text-center sm:px-14">
	<svg class="ink-draw" width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M4 28c14-14 24 6 36-4s18-16 28-4 20 10 30 0 12-8 18-6" /></svg>
	<h3 class="m-0 font-serif text-2xl font-normal text-ink">{title}</h3>
	<p class="m-0 max-w-[360px] text-sm leading-relaxed text-muted">{text}</p>
	{#if children}<div class="mt-1 flex flex-wrap justify-center gap-3">{@render children()}</div>{/if}
</div>
