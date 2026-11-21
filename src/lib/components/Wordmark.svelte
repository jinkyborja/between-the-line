<script lang="ts">
	let { href = '/', size = 24 }: { href?: string; size?: number } = $props();
</script>

<a
	{href}
	class="font-serif tracking-[-0.01em] text-ink-2 hover:text-ink-2"
	style="font-size: {size}px"
	>Between the <em>Lines</em><span class="text-rose">.</span></a
>
