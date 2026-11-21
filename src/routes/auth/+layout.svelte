<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<!-- Authentication shell: quiet poem panel (wide screens) + a focused form column. -->
<div class="auth-shell bg-paper">
	<aside class="panel" aria-label="A few lines while you sign in">
		<div class="auth-mark"><Wordmark size={24} /></div>
		<figure class="quote-in m-0 flex max-w-[440px] flex-col gap-6">
			<span class="h-px w-10 bg-[#c9a89b]" aria-hidden="true"></span>
			<blockquote class="m-0 font-serif text-[clamp(26px,2.4vw,32px)] leading-[1.45] font-light whitespace-pre-line">Come in. Leave your coat
and whatever you were
pretending to be today.</blockquote>
			<figcaption class="text-sm text-[#d6c7b9]">from “Threshold”, Ines Varga</figcaption>
		</figure>
		<ul class="m-0 flex list-none flex-col gap-3 p-0 text-[13px] text-[#d6c7b9]">
			<li class="flex items-center gap-2.5"><Icon name="lock" size={16} />Journals and letters are private to you.</li>
			<li class="flex items-center gap-2.5"><Icon name="community" size={16} />Community posts are always anonymous.</li>
		</ul>
	</aside>

	<div class="form-col">
		<header class="flex items-center justify-between gap-4">
			<span class="lg:invisible"><Wordmark size={22} /></span>
			<a href="/" class="back"><Icon name="back" size={16} />Home</a>
		</header>
		<main id="main" class="flex flex-1 items-center justify-center py-10">
			<div class="w-full max-w-[400px]">
				{@render children()}
			</div>
		</main>
		<p class="m-0 text-center text-xs text-subtle">
			<a class="text-subtle" href="/#privacy">Privacy</a> · <a class="text-subtle" href="/#guidelines">Guidelines</a> · © 2026 Between the Lines
		</p>
	</div>
</div>

<style>
	.auth-shell {
		display: grid;
		min-height: 100vh;
		min-height: 100dvh;
	}
	@media (min-width: 1024px) {
		.auth-shell {
			grid-template-columns: minmax(380px, 0.85fr) 1fr;
		}
	}
	/* The poem panel only appears where there's room beside the form. */
	.panel {
		display: none;
		flex-direction: column;
		justify-content: space-between;
		gap: 48px;
		padding: 44px 52px;
		background: #3b2d27;
		color: #f3ece2;
		position: sticky;
		top: 0;
		height: 100vh;
		height: 100dvh;
	}
	@media (min-width: 1024px) {
		.panel {
			display: flex;
		}
	}
	.form-col {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: 20px 20px 24px;
	}
	@media (min-width: 640px) {
		.form-col {
			padding: 28px 40px 28px;
		}
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		padding: 0 10px;
		margin-right: -10px;
		border-radius: var(--radius-xs);
		font-size: 13px;
		font-weight: 500;
		color: var(--color-muted);
		transition: color var(--t2), background-color var(--t2);
	}
	.back:hover {
		color: var(--color-ink);
		background: var(--color-beige);
	}
	.auth-mark :global(a),
	.auth-mark :global(a:hover) {
		color: #f3ece2;
	}
	.auth-mark :global(a span) {
		color: #c9a89b;
	}
	.quote-in {
		animation: lineIn 1.2s var(--ease-out) 0.2s both;
	}
</style>
