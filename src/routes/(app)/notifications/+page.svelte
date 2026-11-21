<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHeader from '#lib/components/PageHeader.svelte';
	import { ago } from '#lib/time.ts';
	import type { IconName } from '#lib/icons.ts';
	import type { Notification } from '#lib/types.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const copy: Record<Notification['type'], { icon: IconName; text: string; tone?: 'quiet' }> = {
		comment: { icon: 'community', text: 'Someone replied kindly to your anonymous post.' },
		appreciation: { icon: 'heart', text: 'Someone felt your anonymous post.' },
		post_hidden: { icon: 'shield', text: 'A moderator removed one of your posts because it didn’t fit our guidelines.', tone: 'quiet' },
		comment_hidden: { icon: 'shield', text: 'A moderator removed one of your replies because it didn’t fit our guidelines.', tone: 'quiet' },
		report_resolved: { icon: 'flag', text: 'Thank you — a report you sent has been reviewed.', tone: 'quiet' },
		letter_reminder: { icon: 'envelope', text: 'A letter you wrote to your future self is ready to be opened.' }
	};

	// Group by when it arrived.
	const groups = $derived.by(() => {
		const startToday = new Date();
		startToday.setHours(0, 0, 0, 0);
		const weekAgo = startToday.getTime() - 6 * 864e5;
		const g: { label: string; items: Notification[] }[] = [
			{ label: 'Today', items: [] },
			{ label: 'This week', items: [] },
			{ label: 'Earlier', items: [] }
		];
		for (const n of data.items) {
			const t = new Date(n.created_at).getTime();
			g[t >= startToday.getTime() ? 0 : t >= weekAgo ? 1 : 2].items.push(n);
		}
		return g.filter((x) => x.items.length);
	});

	let confirmClear = $state(false);
	let clearing = $state(false);
	async function clearAll() {
		clearing = true;
		await data.supabase.from('notifications').delete().not('id', 'is', null);
		clearing = false;
		confirmClear = false;
		await invalidateAll();
	}
</script>

<svelte:head><title>Notifications — Between the Lines</title></svelte:head>

<div class="flex max-w-[760px] flex-col gap-8">
	<PageHeader title="Notifications" lede="Quiet updates about your anonymous posts and letters. We never tell you who.">
		{#snippet actions()}
			<a class="btn btn-quiet btn-sm" href="/settings#notifications"><Icon name="settings" size={16} />Preferences</a>
			{#if data.items.length}<button class="btn btn-ghost btn-sm" onclick={() => (confirmClear = true)}>Clear all</button>{/if}
		{/snippet}
	</PageHeader>

	{#if data.items.length}
		{#each groups as g (g.label)}
			<section aria-labelledby="g-{g.label}" class="flex flex-col gap-2">
				<h2 id="g-{g.label}" class="eyebrow m-0 text-subtle">{g.label}</h2>
				<ul class="surface m-0 list-none p-0">
					{#each g.items as n (n.id)}
						{@const c = copy[n.type]}
						{@const fresh = data.unreadIds.includes(n.id)}
						<li class="note" class:fresh>
							<span class="ico" class:quiet={c.tone === 'quiet'}><Icon name={c.icon} size={17} /></span>
							<span class="flex min-w-0 flex-1 flex-col gap-1">
								<span class="text-[15px] leading-normal text-ink-2">
									{#if fresh}<span class="sr-only">New: </span>{/if}{c.text}
								</span>
								<span class="text-xs text-subtle">
									<time datetime={n.created_at}>{ago(n.created_at)}</time>
									{#if n.post_id && (n.type === 'comment' || n.type === 'appreciation')} · <a href="/community?sort=mine">See your posts</a>{/if}
									{#if n.letter_id} · <a href="/letters/write?id={n.letter_id}">Open your letter</a>{/if}
								</span>
							</span>
							{#if fresh}<span class="new" aria-hidden="true">New</span>{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{:else}
		<EmptyState title="Nothing new." text="When someone feels or replies to something you shared, or a letter is ready to open, you’ll find a quiet note here.">
			<a class="btn btn-ghost" href="/community">Visit the community</a>
		</EmptyState>
	{/if}
</div>

<ConfirmDialog open={confirmClear} title="Clear all notifications?" confirmLabel="Clear all" cancelLabel="Keep them" busy={clearing} onconfirm={clearAll} oncancel={() => (confirmClear = false)}>
	This only removes the notes. Your posts, replies and letters stay as they are.
</ConfirmDialog>

<style>
	.note {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 16px 18px;
		border-bottom: 1px solid var(--color-line-soft);
	}
	.note:last-child {
		border-bottom: 0;
	}
	.note.fresh {
		background: var(--color-sand-2);
		box-shadow: inset 2px 0 0 var(--color-dusty);
	}
	.ico {
		width: 36px;
		height: 36px;
		flex: none;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-rose-tint);
		color: var(--color-rose);
	}
	.ico.quiet {
		background: var(--color-beige);
		color: var(--color-mocha);
	}
	.new {
		flex: none;
		margin-top: 2px;
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--color-rose);
		color: var(--color-cream);
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.04em;
	}
</style>
