<script lang="ts">
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import Wordmark from './Wordmark.svelte';
	import { isActive, navGroups } from '#lib/nav.ts';

	let {
		displayName,
		isAdmin = false,
		unread = 0,
		variant = 'full',
		onnavigate
	}: {
		displayName: string;
		isAdmin?: boolean;
		unread?: number;
		/** full = desktop sidebar · rail = tablet icon rail · drawer = inside the mobile menu */
		variant?: 'full' | 'rail' | 'drawer';
		onnavigate?: () => void;
	} = $props();

	const rail = $derived(variant === 'rail');
	const initial = $derived(displayName.trim().charAt(0).toUpperCase() || '·');
	const groups = $derived(
		navGroups.map((g) => ({ ...g, items: g.items.filter((i) => !i.adminOnly || isAdmin) }))
	);
	const unreadLabel = $derived(unread > 9 ? '9+' : String(unread));
</script>

<div
	class="side"
	class:rail
	class:drawer={variant === 'drawer'}
>
	{#if !rail}
		<div class="px-3"><Wordmark href="/discover" /></div>
	{:else}
		<a href="/discover" class="mark" aria-label="Between the Lines — Discover">B<span class="text-rose">.</span></a>
	{/if}

	<!-- Primary action -->
	<div class="flex flex-col gap-2">
		<a href="/write" class="btn btn-primary write" aria-label={rail ? 'New reflection' : undefined} title={rail ? 'New reflection' : undefined} onclick={onnavigate}>
			<Icon name="pen" size={18} />{#if !rail}New reflection{/if}
		</a>
		{#if !rail}
			<a href="/letters/write?kind=present" class="px-3 text-[13px] font-medium" onclick={onnavigate}>or write a letter to yourself →</a>
		{/if}
	</div>

	<nav aria-label="App" class="flex flex-col gap-5">
		{#each groups as g (g.label)}
			<div class="flex flex-col gap-0.5" role="group" aria-labelledby={rail ? undefined : `nav-${variant}-${g.label}`} aria-label={rail ? g.label : undefined}>
				{#if !rail}
					<span id="nav-{variant}-{g.label}" class="group-label">{g.label}</span>
				{:else}
					<span class="rail-sep" aria-hidden="true"></span>
				{/if}
				{#each g.items as item (item.href)}
					{@const on = isActive(page.url.pathname, item.href)}
					{@const count = item.badge === 'unread' && unread > 0}
					<a
						href={item.href}
						aria-current={on ? 'page' : undefined}
						aria-label={rail ? `${item.label}${count ? `, ${unread} unread` : ''}` : undefined}
						title={rail ? item.label : undefined}
						class="nav-row"
						class:on
						onclick={onnavigate}
					>
						<Icon name={item.icon} />
						{#if !rail}
							<span class="flex-1">{item.label}</span>
							{#if item.private}<span class="text-subtle"><Icon name="lock" size={14} label="Private" /></span>{/if}
							{#if count}<span class="count" aria-label="{unread} unread">{unreadLabel}</span>{/if}
						{:else if count}
							<span class="dot" aria-hidden="true"></span>
						{/if}
					</a>
				{/each}
			</div>
		{/each}
	</nav>

	<div class="flex-1"></div>

	{#if !rail}
		<p class="m-0 px-3 font-serif text-[15px] leading-[1.55] text-muted italic">
			“You don’t have to be ready. You only have to begin.”
		</p>
	{/if}

	<!-- You -->
	<div class="you" class:rail>
		<a href="/account" class="flex min-w-0 flex-1 items-center gap-3 text-ink-2 hover:text-ink-2" aria-label={rail ? `Account — ${displayName}` : undefined} title={rail ? displayName : undefined} onclick={onnavigate}>
			<span class="avatar" aria-hidden="true">{initial}</span>
			{#if !rail}
				<span class="flex min-w-0 flex-col gap-0.5">
					<span class="truncate text-sm font-medium">{displayName}</span>
					<span class="text-xs text-subtle">Only you see this</span>
				</span>
			{/if}
		</a>
		<form method="POST" action="/auth/logout">
			<button class="icon-btn size-10!" aria-label="Sign out" title="Sign out"><Icon name="logout" size={18} /></button>
		</form>
	</div>
</div>

<style>
	.side {
		position: sticky;
		top: 0;
		height: 100vh;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		gap: 26px;
		overflow-y: auto;
		padding: 26px 18px 18px;
		background: var(--color-sand);
		border-right: 1px solid var(--color-line);
		color: var(--color-ink-2);
		scrollbar-width: thin;
	}
	.side.drawer {
		position: static;
		height: 100%;
		border-right: 0;
		padding-top: 22px;
	}
	.side.rail {
		align-items: center;
		gap: 20px;
		padding: 22px 10px 14px;
	}
	.mark {
		font: 400 28px/1 var(--font-serif);
		color: var(--color-ink);
	}
	.write {
		min-height: 46px;
	}
	.rail .write {
		width: 48px;
		min-height: 48px;
		padding: 0;
		border-radius: 50%;
	}
	.group-label {
		padding: 0 12px 6px;
		font: 600 10.5px var(--font-sans);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-subtle);
	}
	.rail-sep {
		display: block;
		width: 24px;
		height: 1px;
		margin: 2px auto 6px;
		background: var(--color-line-strong);
	}
	.rail nav > div:first-child .rail-sep {
		display: none;
	}
	.nav-row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 42px;
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
	.rail .nav-row {
		width: 48px;
		height: 44px;
		justify-content: center;
		padding: 0;
	}
	.nav-row:hover {
		color: var(--color-ink);
		background: rgb(255 255 255 / 0.35);
	}
	.nav-row.on {
		background: var(--color-card);
		color: var(--color-ink);
		font-weight: 600;
		box-shadow: inset 2px 0 0 var(--color-rose);
	}
	.count {
		min-width: 20px;
		padding: 1px 6px;
		border-radius: 999px;
		background: var(--color-rose);
		color: var(--color-cream);
		font-size: 11px;
		font-weight: 600;
		text-align: center;
	}
	.dot {
		position: absolute;
		top: 10px;
		right: 11px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-rose);
		box-shadow: 0 0 0 2px var(--color-sand);
	}
	.you {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 6px 8px 10px;
		background: var(--color-card);
		border: 1px solid var(--color-line);
		border-radius: 2px;
	}
	.you.rail {
		flex-direction: column;
		padding: 8px 4px;
		gap: 4px;
	}
	.avatar {
		width: 34px;
		height: 34px;
		flex: none;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-mocha);
		color: var(--color-cream);
		font: 400 16px var(--font-serif);
	}
	:global([data-theme='dark']) .nav-row:hover {
		background: rgb(255 255 255 / 0.04);
	}
</style>
