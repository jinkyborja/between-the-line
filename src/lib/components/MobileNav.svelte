<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import { isActive } from '#lib/nav.ts';
	import type { IconName } from '#lib/icons.ts';

	type Tab = { href: string; label: string; icon: IconName } | null;
	// Four destinations with the raised Write action in the middle (null).
	const tabs: Tab[] = [
		{ href: '/discover', label: 'Discover', icon: 'discover' },
		{ href: '/library', label: 'Library', icon: 'library' },
		null,
		{ href: '/journal', label: 'Journal', icon: 'journal' },
		{ href: '/community', label: 'Community', icon: 'community' }
	];

	const activeIndex = $derived(tabs.findIndex((t) => t && isActive(page.url.pathname, t.href)));
</script>

<!-- Mobile bottom nav — matches "Component · Bottom nav". The rose indicator slides between tabs. -->
<nav
	aria-label="App"
	class="vt-bottomnav fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 items-center border-t border-line bg-[rgb(251_248_243/0.96)] px-2 pt-2 pb-[max(14px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
>
	<span
		aria-hidden="true"
		class="indicator"
		style="left: calc(8px + (100% - 16px) / 5 * {Math.max(activeIndex, 0)} + (100% - 16px) / 10 - 12px); opacity: {activeIndex >= 0 ? 1 : 0}"
	></span>
	{#each tabs as tab, i (i)}
		{#if tab}
			{@const on = i === activeIndex}
			<a
				href={tab.href}
				aria-current={on ? 'page' : undefined}
				class="tab flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] tracking-[0.01em] transition-colors duration-[240ms] {on
					? 'font-semibold text-rose'
					: 'font-medium text-muted'}"
				class:on
			>
				<span class="ico"><Icon name={tab.icon} size={22} filled={false} /></span>
				{tab.label}
			</a>
		{:else}
			<a href="/write" aria-label="New reflection" class="write"><Icon name="pen" size={22} /></a>
		{/if}
	{/each}
</nav>

<style>
	.indicator {
		position: absolute;
		top: -1px;
		width: 24px;
		height: 2px;
		border-radius: 2px;
		background: var(--color-rose);
		transition:
			left var(--t3) var(--ease-out),
			opacity var(--t2);
	}
	/* Active icon lifts 2px; a press gently settles. No bounce. */
	.ico {
		display: inline-flex;
		transition: transform var(--t3) var(--ease-out);
	}
	.tab.on .ico {
		transform: translateY(-2px);
	}
	.tab {
		-webkit-tap-highlight-color: transparent;
		transition:
			color var(--t2) var(--ease-out),
			opacity var(--t1) var(--ease-out);
	}
	.tab:active {
		opacity: 0.7;
	}
	@media (prefers-reduced-motion: reduce) {
		.tab.on .ico {
			transform: none;
		}
	}
	.write {
		justify-self: center;
		width: 52px;
		height: 52px;
		margin-top: -18px;
		border-radius: 50%;
		background: var(--color-espresso);
		color: var(--color-cream);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 10px 20px -10px rgb(63 50 43 / 0.6);
		transition:
			transform var(--t1) var(--ease-out),
			box-shadow var(--t2) var(--ease-out);
	}
	.write:hover {
		color: var(--color-cream);
	}
	.write:active {
		transform: scale(0.94);
		box-shadow: 0 4px 10px -6px rgb(63 50 43 / 0.6);
	}
</style>
