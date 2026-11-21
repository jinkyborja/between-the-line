<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import Wordmark from './Wordmark.svelte';
	import { accountNav, isActive, mainNav } from '#lib/nav.ts';

	let {
		displayName,
		isAdmin = false,
		unread = 0
	}: { displayName: string; isAdmin?: boolean; unread?: number } = $props();

	const notifOn = $derived(isActive(page.url.pathname, '/notifications'));
	const initial =$derived(displayName.trim().charAt(0).toUpperCase() || '·');
</script>

<!-- Desktop sidebar — matches "Component · Sidebar" in the design. -->
<div
	class="sticky top-0 flex h-screen flex-col gap-8 overflow-y-auto border-r border-line bg-sand px-5 py-7 text-ink-2"
>
	<div class="px-3"><Wordmark href="/discover" /></div>

	<a href="/write" class="btn btn-primary min-h-[46px]"><Icon name="pen" size={18} />New reflection</a>

	<nav aria-label="App" class="flex flex-col gap-0.5">
		{#each mainNav as item (item.href)}
			{@const on = isActive(page.url.pathname, item.href)}
			<a href={item.href} aria-current={on ? 'page' : undefined} class="nav-row" class:on>
				<Icon name={item.icon} />
				<span class="flex-1">{item.label}</span>
				{#if item.private}<span class="text-subtle"><Icon name="lock" size={14} label="Private" /></span>{/if}
			</a>
		{/each}
		<a href="/notifications" aria-current={notifOn ? 'page' : undefined} class="nav-row" class:on={notifOn}>
			<Icon name="bell" /><span class="flex-1">Notifications</span>
			{#if unread}<span class="rounded-full bg-rose px-2 py-0.5 text-[11px] font-semibold text-cream" aria-label="{unread} unread">{unread > 9 ? '9+' : unread}</span>{/if}
		</a>
		{#if isAdmin}
			{@const on = isActive(page.url.pathname, '/admin')}
			<a href="/admin" aria-current={on ? 'page' : undefined} class="nav-row" class:on>
				<Icon name="shield" /><span class="flex-1">Moderation</span>
			</a>
		{/if}
	</nav>

	<div class="flex-1"></div>

	<p class="m-0 px-3 font-serif text-[15px] leading-[1.55] text-muted italic">
		“You don’t have to be ready. You only have to begin.”
	</p>

	<div class="flex flex-col gap-0.5 border-t border-line-strong pt-4">
		{#each accountNav as item (item.href)}
			{@const on = isActive(page.url.pathname, item.href)}
			<a href={item.href} aria-current={on ? 'page' : undefined} class="nav-row" class:on>
				<Icon name={item.icon} /><span class="flex-1">{item.label}</span>
			</a>
		{/each}
		<form method="POST" action="/auth/logout">
			<button class="nav-row w-full border-0 bg-transparent text-left">
				<Icon name="logout" /><span class="flex-1">Sign out</span>
			</button>
		</form>
	</div>

	<a
		href="/account"
		class="flex items-center gap-3 rounded-xs border border-line bg-card p-3 text-ink-2 hover:text-ink-2"
	>
		<span
			class="inline-flex size-9 flex-none items-center justify-center rounded-full bg-rose font-serif text-base text-cream"
			aria-hidden="true">{initial}</span
		>
		<span class="flex min-w-0 flex-col gap-0.5">
			<span class="truncate text-sm font-medium">{displayName}</span>
			<span class="text-xs text-subtle">Only you see this</span>
		</span>
	</a>
</div>

<style>
	.nav-row {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 44px;
		padding: 0 12px;
		border-radius: 2px;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-body);
		transition:
			background-color var(--t2) var(--ease-out),
			color var(--t2) var(--ease-out),
			box-shadow var(--t3) var(--ease-out);
	}
	.nav-row:hover {
		color: var(--color-ink);
	}
	.nav-row.on {
		background: var(--color-card);
		color: var(--color-ink);
		font-weight: 600;
		box-shadow: inset 2px 0 0 var(--color-rose);
	}
</style>
