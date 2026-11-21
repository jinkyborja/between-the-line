<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		open,
		text,
		onundo,
		icon = true
	}: { open: boolean; text: string; onundo?: () => void; icon?: boolean } = $props();
</script>

<!-- Bottom-centre toast from the design (role=status, optional Undo). -->
<div class="toast" class:open role="status" aria-live="polite">
	{#if icon}<span class="text-rose-soft"><Icon name="bookmark" size={18} filled /></span>{/if}
	<span>{text}</span>
	{#if onundo}<button type="button" onclick={onundo}>Undo</button>{/if}
</div>

<style>
	.toast {
		position: fixed;
		left: 50%;
		bottom: 32px;
		z-index: 40;
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 18px;
		background: #2b2522; /* fixed: same in light and dark */
		color: #f3ece2;
		border: 1px solid rgb(255 255 255 / 0.06);
		border-radius: 6px;
		font-size: 14px;
		box-shadow: 0 20px 40px -20px rgb(43 37 34 / 0.6);
		opacity: 0;
		transform: translate(-50%, 10px);
		visibility: hidden;
		transition:
			opacity var(--t2) var(--ease-out),
			transform var(--t3) var(--ease-out),
			visibility 0s linear var(--t3);
	}
	@media (max-width: 767px) {
		.toast {
			bottom: 104px;
		}
	}
	.toast.open {
		opacity: 1;
		transform: translate(-50%, 0);
		visibility: visible;
		transition:
			opacity var(--t2) var(--ease-out),
			transform var(--t3) var(--ease-out),
			visibility 0s;
	}
	button {
		background: none;
		border: 0;
		padding: 0;
		color: #e8c9c4;
		font: 500 14px var(--font-sans);
	}
</style>
