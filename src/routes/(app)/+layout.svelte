<script lang="ts">
	import Sidebar from '#lib/components/Sidebar.svelte';
	import MobileNav from '#lib/components/MobileNav.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen">
	<aside class="vt-sidebar hidden w-[260px] flex-none lg:block">
		<Sidebar displayName={data.displayName} isAdmin={data.isAdmin} unread={data.unreadNotifications} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col">
		<!-- Mobile top bar -->
		<header
			class="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-[rgb(247_242_234/0.94)] px-5 py-3 backdrop-blur lg:hidden"
		>
			<Wordmark href="/discover" size={20} />
			<span class="flex items-center gap-1">
				<a href="/letters" class="inline-flex size-11 items-center justify-center text-body" aria-label="Letters to Myself"><Icon name="envelope" /></a>
				<a href="/notifications" class="relative inline-flex size-11 items-center justify-center text-body" aria-label="Notifications{data.unreadNotifications ? `, ${data.unreadNotifications} unread` : ''}">
					<Icon name="bell" />
					{#if data.unreadNotifications}<span class="absolute top-2.5 right-2.5 size-2 rounded-full bg-rose" aria-hidden="true"></span>{/if}
				</a>
				{#if data.isAdmin}<a href="/admin" class="inline-flex size-11 items-center justify-center text-body" aria-label="Moderation"><Icon name="shield" /></a>{/if}
				<a href="/account" class="inline-flex size-11 items-center justify-center text-body" aria-label="Account"><Icon name="account" /></a>
			</span>
		</header>

		<main class="page-in flex-1 px-5 pt-7 pb-28 sm:px-8 lg:px-12 lg:pb-20">
			<div class="mx-auto max-w-[1080px]">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<MobileNav />
