<script lang="ts">
	import Sidebar from '#lib/components/Sidebar.svelte';
	import MobileNav from '#lib/components/MobileNav.svelte';
	import MobileMenu from '#lib/components/MobileMenu.svelte';
	import Wordmark from '#lib/components/Wordmark.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<!--
	Layout
	  ≥1024px  full sidebar (grouped navigation)
	  768–1023 icon rail
	  <768px   top bar with menu drawer + bottom tab bar
-->
<a href="#main" class="skip">Skip to content</a>

<div class="flex min-h-screen">
	<aside class="vt-sidebar hidden w-[264px] flex-none lg:block">
		<Sidebar displayName={data.displayName} isAdmin={data.isAdmin} unread={data.unreadNotifications} />
	</aside>
	<aside class="vt-sidebar hidden w-[76px] flex-none md:block lg:hidden">
		<Sidebar displayName={data.displayName} isAdmin={data.isAdmin} unread={data.unreadNotifications} variant="rail" />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col">
		<!-- Phone top bar -->
		<header class="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line-soft bg-[rgb(247_242_234/0.94)] py-1.5 pr-2 pl-5 backdrop-blur md:hidden">
			<Wordmark href="/discover" size={20} />
			<span class="flex items-center">
				<a href="/notifications" class="icon-btn" aria-label="Notifications{data.unreadNotifications ? `, ${data.unreadNotifications} unread` : ''}">
					<Icon name="bell" />
					{#if data.unreadNotifications}<span class="absolute top-2.5 right-2.5 size-2 rounded-full bg-rose" aria-hidden="true"></span>{/if}
				</a>
				<MobileMenu displayName={data.displayName} isAdmin={data.isAdmin} unread={data.unreadNotifications} />
			</span>
		</header>

		<main id="main" tabindex="-1" class="page-in flex-1 px-5 pt-7 pb-28 outline-none sm:px-8 md:pt-10 md:pb-20 lg:px-12">
			<div class="mx-auto w-full max-w-[1080px]">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<MobileNav />

<style>
	.skip {
		position: absolute;
		left: 12px;
		top: -60px;
		z-index: 50;
		padding: 10px 14px;
		background: var(--color-espresso);
		color: var(--color-cream);
		border-radius: 2px;
		font-size: 14px;
		transition: top var(--t2) var(--ease-out);
	}
	.skip:focus {
		top: 12px;
		color: var(--color-cream);
	}
	:global([data-theme='dark']) header {
		background: rgb(29 25 22 / 0.94);
	}
</style>
