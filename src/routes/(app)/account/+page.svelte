<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const name = $derived(data.profile?.display_name ?? 'Reader');
	const since = $derived(
		data.profile ? new Date(data.profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''
	);
</script>

<svelte:head><title>Account — Between the Lines</title></svelte:head>

<div class="flex max-w-[880px] flex-col gap-10">
	<!-- Owner-only notice (replaces the design's "public profile" banner) -->
	<div class="flex flex-wrap items-center justify-between gap-3 border border-line bg-sand px-5 py-3.5 text-sm text-ink-3">
		<span class="flex items-center gap-2.5"><Icon name="lock" size={16} />Only you can see this page. There are no public profiles here.</span>
	</div>

	<section class="flex flex-wrap items-center gap-6">
		<span class="inline-flex size-24 flex-none items-center justify-center rounded-full bg-rose font-serif text-[40px] text-cream" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
		<div class="flex min-w-0 flex-1 flex-col gap-2">
			<h1 class="m-0 font-serif text-[40px] leading-tight font-light tracking-[-0.02em] text-ink sm:text-[48px]">{name}</h1>
			<p class="m-0 text-sm text-subtle">Writing since {since} · {data.email}</p>
		</div>
		<a class="btn btn-ghost" href="/settings#account">Edit account</a>
	</section>

	{#if data.profile?.bio}
		<p class="m-0 max-w-[620px] font-serif text-xl leading-[1.6] text-ink-3 italic">{data.profile.bio}</p>
	{/if}

	<section aria-label="Your activity, privately" class="grid grid-cols-[repeat(auto-fit,minmax(min(160px,100%),1fr))] border border-line bg-card">
		{#each [[data.stats.reflections, 'reflections saved', '/journal'], [data.stats.drafts, 'drafts waiting', '/journal'], [data.stats.bookmarks, 'bookmarks', '/bookmarks'], [data.stats.posts, 'anonymous posts', '/community?sort=mine']] as [n, label, href] (label)}
			<a href={String(href)} class="stat flex flex-col gap-1.5 p-6 text-ink hover:bg-sheet">
				<span class="font-serif text-[40px] font-light">{n}</span><span class="text-[13px] text-muted">{label}</span>
			</a>
		{/each}
	</section>

	<div class="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5">
		<div class="flex flex-col gap-3 border border-line bg-sheet p-7">
			<span class="eyebrow text-subtle">You often read</span>
			{#if data.oftenReads.length}
				<div class="flex flex-wrap gap-2">{#each data.oftenReads as c (c)}<span class="chip">{c}</span>{/each}</div>
			{:else}
				<p class="m-0 text-sm text-muted">Write about a few poems and your patterns will appear here — only for you.</p>
			{/if}
		</div>
		<div class="flex flex-col gap-3 border border-line bg-sheet p-7">
			<span class="eyebrow text-subtle">Your anonymous posts</span>
			<p class="m-0 text-[15px] leading-relaxed text-body">
				{#if data.stats.posts}
					{data.stats.posts} {data.stats.posts === 1 ? 'post' : 'posts'}, felt {data.stats.felt} {data.stats.felt === 1 ? 'time' : 'times'}. No one can see they’re yours.
				{:else}
					You haven’t shared anything. That’s completely fine.
				{/if}
			</p>
			<a href="/community?sort=mine" class="text-sm font-medium">See your posts →</a>
		</div>
	</div>

	<div class="flex flex-wrap gap-3 border-t border-line pt-8">
		<a class="btn btn-ghost" href="/settings">Settings</a>
		<a class="btn btn-ghost" href="/settings/export" download>Download my journal</a>
		<form method="POST" action="/auth/logout"><button class="btn btn-ghost">Sign out</button></form>
	</div>
</div>

<style>
	.stat + .stat {
		border-left: 1px solid var(--color-line-soft);
	}
</style>
