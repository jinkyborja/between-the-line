<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { invalidate, onNavigate } from '$app/navigation';
	import { navigating } from '$app/state';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	/**
	 * Page transitions: a soft cross-fade with a few pixels of rise, using the
	 * View Transitions API. Navigation chrome (sidebar, bottom nav) is named
	 * separately so it stays still. Query-only changes (filters, search) and
	 * reduced-motion users skip it entirely.
	 */
	onNavigate((nav) => {
		if (!document.startViewTransition) return;
		if (nav.from?.url.pathname === nav.to?.url.pathname) return;
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await nav.complete;
			});
		});
	});

	// Only show the loading line if a navigation is actually slow (>250ms).
	let slow = $state(false);
	$effect(() => {
		if (!navigating.to) {
			slow = false;
			return;
		}
		const t = setTimeout(() => (slow = true), 250);
		return () => clearTimeout(t);
	});

	onMount(() => {
		// Keep server-rendered data in step with sign-in / sign-out in any tab.
		const { data: sub } = data.supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) invalidate('supabase:auth');
		});
		return () => sub.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Between the Lines</title>
	<meta
		name="description"
		content="Some feelings are difficult to explain. Here, you don't have to. Just write."
	/>
</svelte:head>

{#if slow}
	<div class="loading-line" role="progressbar" aria-label="Loading" aria-busy="true"></div>
{/if}

{@render children()}

<style>
	/* A slow, thin ink line — never a spinner. */
	.loading-line {
		position: fixed;
		inset: 0 0 auto 0;
		z-index: 60;
		height: 2px;
		background: linear-gradient(90deg, transparent, var(--color-rose) 40%, var(--color-rose-soft) 60%, transparent);
		background-size: 50% 100%;
		background-repeat: no-repeat;
		animation: travel 1.4s var(--ease-io) infinite;
		opacity: 0.8;
	}
	@keyframes travel {
		from {
			background-position: -50% 0;
		}
		to {
			background-position: 150% 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.loading-line {
			animation: none;
			background: var(--color-rose);
			opacity: 0.4;
		}
	}
</style>
