<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { ago } from '#lib/time.ts';
	import type { IconName } from '#lib/icons.ts';
	import type { Notification } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const copy: Record<Notification['type'], { icon: IconName; text: string }> = {
		comment: { icon: 'community', text: 'Someone replied kindly to your anonymous post.' },
		appreciation: { icon: 'heart', text: 'Someone felt your anonymous post.' },
		post_hidden: { icon: 'shield', text: 'A moderator removed one of your posts because it didn’t fit our guidelines.' },
		comment_hidden: { icon: 'shield', text: 'A moderator removed one of your replies because it didn’t fit our guidelines.' },
		report_resolved: { icon: 'flag', text: 'Thank you — a report you sent has been reviewed.' },
		letter_reminder: { icon: 'envelope', text: 'A letter you wrote to your future self is ready to be opened.' }
	};

	async function clearAll() {
		await data.supabase.from('notifications').delete().not('id', 'is', null);
		await invalidateAll();
	}
</script>

<svelte:head><title>Notifications — Between the Lines</title></svelte:head>

<div class="flex max-w-[720px] flex-col gap-8">
	<header class="flex flex-wrap items-end justify-between gap-4">
		<div class="flex flex-col gap-3">
			<h1 class="m-0 font-serif text-[42px] font-light tracking-[-0.025em] text-ink sm:text-[52px]">Notifications</h1>
			<p class="m-0 text-[15px] text-muted">Quiet updates about your anonymous posts. We never tell you who.</p>
		</div>
		{#if data.items.length}<button class="btn btn-ghost" onclick={clearAll}>Clear all</button>{/if}
	</header>

	{#if data.items.length}
		<ul class="m-0 flex list-none flex-col border border-line bg-sheet p-0">
			{#each data.items as n (n.id)}
				{@const c = copy[n.type]}
				<li class="flex items-start gap-4 border-b border-line-soft p-5 last:border-b-0" class:fresh={data.unreadIds.includes(n.id)}>
					<span class="inline-flex size-9 flex-none items-center justify-center rounded-full bg-rose-tint text-rose"><Icon name={c.icon} size={17} /></span>
					<span class="flex flex-1 flex-col gap-1">
						<span class="text-[15px] leading-normal text-ink-2">{c.text}</span>
						<span class="text-xs text-subtle">{ago(n.created_at)}{#if n.post_id && (n.type === 'comment' || n.type === 'appreciation')} · <a href="/community?sort=mine">See your posts</a>{/if}{#if n.letter_id} · <a href="/letters/write?id={n.letter_id}">Open your letter</a>{/if}</span>
					</span>
				</li>
			{/each}
		</ul>
	{:else}
		<EmptyState title="Nothing new." text="When someone feels or replies to something you shared, you’ll see it here." />
	{/if}
</div>

<style>
	.fresh {
		background: var(--color-sand-2);
		box-shadow: inset 2px 0 0 var(--color-rose);
	}
</style>
