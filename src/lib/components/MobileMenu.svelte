<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import Icon from './Icon.svelte';
	import Sidebar from './Sidebar.svelte';

	let { displayName, isAdmin = false, unread = 0 }: { displayName: string; isAdmin?: boolean; unread?: number } = $props();

	let el = $state<HTMLDialogElement>();
	const open = () => el?.showModal();
	const close = () => el?.close();

	// Close after any navigation (links inside, or back/forward).
	afterNavigate(() => close());
</script>

<button class="icon-btn" aria-label="Open menu{unread ? `, ${unread} unread notifications` : ''}" aria-haspopup="dialog" onclick={open}>
	<Icon name="menu" />
	{#if unread}<span class="absolute top-2.5 right-2.5 size-2 rounded-full bg-rose" aria-hidden="true"></span>{/if}
</button>

<!-- Native dialog: focus trap, Esc to close, inert page behind. -->
<dialog
	bind:this={el}
	class="drawer"
	aria-label="Menu"
	onclick={(e) => e.target === el && close()}
>
	<div class="relative h-full">
		<button class="icon-btn absolute top-3 right-3 z-1" aria-label="Close menu" onclick={close}><Icon name="close" /></button>
		<Sidebar {displayName} {isAdmin} {unread} variant="drawer" onnavigate={close} />
	</div>
</dialog>

<style>
	.drawer {
		margin: 0 0 0 auto;
		width: min(320px, 86vw);
		max-width: none;
		height: 100dvh;
		max-height: none;
		padding: 0;
		border: 0;
		border-left: 1px solid var(--color-line);
		background: var(--color-sand);
		box-shadow: var(--shadow-float);
		transform: translateX(100%);
		transition:
			transform var(--t3) var(--ease-out),
			overlay var(--t3) allow-discrete,
			display var(--t3) allow-discrete;
	}
	.drawer[open] {
		transform: none;
	}
	@starting-style {
		.drawer[open] {
			transform: translateX(100%);
		}
	}
	.drawer::backdrop {
		background: rgb(43 37 34 / 0);
		transition:
			background-color var(--t3) var(--ease-out),
			overlay var(--t3) allow-discrete,
			display var(--t3) allow-discrete;
	}
	.drawer[open]::backdrop {
		background: rgb(43 37 34 / 0.38);
	}
	@starting-style {
		.drawer[open]::backdrop {
			background: rgb(43 37 34 / 0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.drawer,
		.drawer::backdrop {
			transition: none;
		}
	}
</style>
