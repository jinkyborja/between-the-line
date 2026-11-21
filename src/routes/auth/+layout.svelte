<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!-- Authentication shell — dark poem panel + form column, from the "Authentication" artboard. -->
<div class="flex min-h-screen flex-wrap bg-paper">
	<aside
		class="flex flex-[1_1_420px] flex-col justify-between gap-12 bg-espresso px-8 py-10 text-cream-2 sm:px-14 sm:py-12"
	>
		<div class="auth-mark"><Wordmark size={26} /></div>
		<figure class="quote-in m-0 flex max-w-[460px] flex-col gap-6">
			<blockquote class="m-0 font-serif text-[26px] leading-[1.45] font-light whitespace-pre-line sm:text-[32px]">Come in. Leave your coat
and whatever you were
pretending to be today.</blockquote>
			<figcaption class="text-sm text-[#CDBFB0]">— from “Threshold”, Ines Varga</figcaption>
		</figure>
		<p class="m-0 flex items-center gap-2.5 text-[13px] text-[#CDBFB0]">
			<Icon name="lock" size={16} />Your reflections are private by default. Always.
		</p>
	</aside>

	<main class="flex min-w-0 flex-[999_1_560px] flex-col items-center justify-center px-6 py-12 sm:px-8">
		<div class="w-full max-w-[420px]">
			{@render children()}
		</div>
	</main>
</div>

<style>
	.auth-mark :global(a),
	.auth-mark :global(a:hover) {
		color: var(--color-cream-2);
	}
	.auth-mark :global(a span) {
		color: var(--color-rose-soft);
	}
	.quote-in {
		animation: lineIn 1.2s var(--ease-out) 0.2s both;
	}
</style>
