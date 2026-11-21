<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { navigating, page } from '$app/state';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import Toast from '#lib/components/Toast.svelte';
	import { GUIDELINES, REPORT_REASONS, friendlyError } from '#lib/community.ts';
	import { createToast } from '#lib/toast.svelte.ts';
	import type { ReportReason } from '#lib/types.ts';
	import Post from './Post.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// Skeletons while switching sort/category on this page (not for "Show more").
	const filtering = $derived(
		navigating.to?.url.pathname === '/community' && navigating.to.url.searchParams.get('more') === null
	);
	const toast = createToast();

	$effect(() => {
		if (data.posted) {
			toast.show('Shared anonymously. Thank you for your honesty.');
			const u = new URL(page.url.href);
			u.searchParams.delete('posted');
			goto(u, { replace: true, reset: false });
		}
	});

	function setParam(changes: Record<string, string>) {
		const u = new URL(page.url.href);
		for (const [k, v] of Object.entries(changes)) v ? u.searchParams.set(k, v) : u.searchParams.delete(k);
		goto(u, { reset: false, replace: true });
	}

	// ---- Report ----------------------------------------------------------
	let reportTarget = $state<{ postId?: string; commentId?: string } | null>(null);
	let reason = $state<ReportReason>('self_harm');
	let details = $state('');
	let reportSent = $state(false);
	let reporting = $state(false);
	let reportEl = $state<HTMLDialogElement>();

	$effect(() => {
		if (!reportEl) return;
		if (reportTarget && !reportEl.open) reportEl.showModal();
		if (!reportTarget && reportEl.open) reportEl.close();
	});

	function openReport(t: { postId?: string; commentId?: string }) {
		reason = 'self_harm';
		details = '';
		reportSent = false;
		reportTarget = t;
	}
	async function sendReport(e: SubmitEvent) {
		e.preventDefault();
		if (!reportTarget) return;
		reporting = true;
		const { error } = await data.supabase.rpc('report_content', {
			p_reason: reason,
			p_post_id: reportTarget.postId ?? null,
			p_comment_id: reportTarget.commentId ?? null,
			p_details: details.trim() || null
		});
		reporting = false;
		if (error) return toast.show(friendlyError(error.message));
		reportSent = true;
	}

	// ---- Delete own post -------------------------------------------------
	let deleteId = $state<string | null>(null);
	let deleting = $state(false);
	async function doDelete() {
		if (!deleteId) return;
		deleting = true;
		const { error } = await data.supabase.rpc('delete_community_post', { p_post_id: deleteId });
		deleting = false;
		deleteId = null;
		if (error) return toast.show(friendlyError(error.message));
		toast.show('Your post was removed.');
		await invalidateAll();
	}
</script>

<svelte:head><title>Community — Between the Lines</title></svelte:head>

<div class="flex flex-wrap items-start gap-12">
	<div class="flex min-w-0 flex-[999_1_520px] flex-col gap-7">
		<header class="flex flex-wrap items-end justify-between gap-5">
			<div class="flex flex-col gap-3">
				<h1 class="m-0 font-serif text-[42px] font-light tracking-[-0.025em] text-ink sm:text-[52px]">Community</h1>
				<p class="m-0 max-w-[520px] text-base leading-relaxed text-muted">
					Reflections people chose to share, anonymously. Read slowly; respond kindly. There are no names or follower counts here, only people.
				</p>
			</div>
			<a class="btn btn-primary" href="/community/new">Share anonymously</a>
		</header>

		<div class="flex flex-col gap-3.5">
			<div role="tablist" aria-label="Sort" class="flex gap-7 border-b border-line">
				{#each [['recent', 'Recent'], ['felt', 'Most felt'], ['mine', 'Your posts']] as [k, label] (k)}
					<button role="tab" class="tab" aria-selected={data.filters.sort === k} onclick={() => setParam({ sort: k === 'recent' ? '' : k, more: '' })}>{label}</button>
				{/each}
			</div>
			<div role="group" aria-label="Filter by category" class="flex flex-wrap gap-2">
				<button class="chip" aria-pressed={!data.filters.category} onclick={() => setParam({ category: '', more: '' })}>All</button>
				{#each data.categories as c (c.id)}
					<button class="chip" aria-pressed={data.filters.category === c.slug} onclick={() => setParam({ category: data.filters.category === c.slug ? '' : c.slug, more: '' })}>{c.name}</button>
				{/each}
			</div>
			{#if data.filters.sort === 'mine'}
				<p class="m-0 text-[13px] text-subtle">Only you can see which posts are yours. To everyone else they’re simply “Anonymous”.</p>
			{/if}
		</div>

		{#if data.error}
			<p role="alert" class="notice-err">{data.error}</p>
		{:else if filtering}
			<div aria-busy="true" aria-label="Loading reflections" class="flex flex-col gap-7">
				{#each [1, 2, 3] as k (k)}
					<div class="flex flex-col gap-4 border border-line bg-sheet p-8">
						<div class="flex items-center gap-3"><div class="skel size-10 rounded-full!"></div><div class="skel h-3 w-32"></div></div>
						<div class="skel h-4 w-[94%]"></div>
						<div class="skel h-4 w-[86%]"></div>
						<div class="skel h-4 w-[60%]"></div>
					</div>
				{/each}
			</div>
		{:else if data.posts.length}
			{#each data.posts as p, i (p.id)}
				<Post post={p} supabase={data.supabase} delay={Math.min(i, 6) * 60} onreport={openReport} ondelete={(id) => (deleteId = id)} onerror={(m) => toast.show(m)} />
			{/each}
			{#if data.hasMore}
				<button class="btn btn-ghost self-center" onclick={() => setParam({ more: String(data.filters.more + 1) })}>Show more</button>
			{/if}
		{:else}
			<EmptyState
				title={data.filters.sort === 'mine' ? 'You haven’t shared anything yet.' : 'It’s quiet here.'}
				text="When you’re ready, you can share a reflection — without your name, ever."
			>
				<a class="btn btn-ghost" href="/community/new">Share anonymously</a>
			</EmptyState>
		{/if}
	</div>

	<!-- Rail -->
	<aside class="flex min-w-0 flex-[1_1_280px] flex-col gap-6 lg:sticky lg:top-8">
		<div class="flex flex-col gap-3.5 bg-espresso p-7 text-cream-2">
			<span class="eyebrow text-rose-soft">How we hold each other</span>
			<ul class="m-0 flex list-none flex-col gap-3 p-0 font-serif text-[17px] leading-[1.45]">
				{#each GUIDELINES as g (g)}<li>{g}</li>{/each}
			</ul>
			<a href="/#guidelines" class="text-sm font-medium text-[#E8C9C4] hover:text-cream">Full guidelines →</a>
		</div>
		{#if data.trending}
			<div class="flex flex-col gap-3.5 border border-line bg-card p-7">
				<span class="eyebrow text-subtle">This week, many are reading</span>
				<a href="/read/{data.trending.slug}" class="font-serif text-[22px] text-ink">{data.trending.title}</a>
				<a class="btn btn-ghost" href="/read/{data.trending.slug}">Read it</a>
			</div>
		{/if}
		<p class="m-0 px-1 text-[13px] leading-relaxed text-subtle">If you’re in danger or thinking about harming yourself, please contact your local emergency number or a crisis line right now.</p>
	</aside>
</div>

<!-- Report modal -->
<dialog class="modal" bind:this={reportEl} aria-labelledby="rt" oncancel={(e) => { e.preventDefault(); reportTarget = null; }} onclick={(e) => e.target === reportEl && (reportTarget = null)}>
	{#if reportSent}
		<div class="flex flex-col gap-4 p-7 sm:p-9">
			<h3 id="rt" class="m-0 font-serif text-[26px] font-normal text-ink">Thank you for looking out.</h3>
			<p class="m-0 text-[15px] leading-relaxed text-muted">A moderator will review this. The writer won’t know who reported it.</p>
			<div class="flex justify-end"><button class="btn btn-primary" onclick={() => (reportTarget = null)}>Done</button></div>
		</div>
	{:else}
		<form class="flex flex-col gap-4 p-7 sm:p-9" onsubmit={sendReport}>
			<h3 id="rt" class="m-0 font-serif text-[26px] font-normal text-ink">What’s wrong with this {reportTarget?.commentId ? 'reply' : 'reflection'}?</h3>
			<fieldset class="m-0 flex flex-col gap-2 border-0 p-0">
				<legend class="sr-only">Reason</legend>
				{#each REPORT_REASONS as r (r.value)}
					<label class="radio"><input type="radio" name="reason" value={r.value} bind:group={reason} class="accent-espresso" />{r.label}</label>
				{/each}
			</fieldset>
			<label class="sr-only" for="rdetails">Anything else? (optional)</label>
			<textarea id="rdetails" class="field" rows="2" maxlength="1000" placeholder="Anything else we should know? (optional)" bind:value={details}></textarea>
			<div class="mt-1 flex justify-end gap-2.5">
				<button type="button" class="btn btn-ghost" onclick={() => (reportTarget = null)}>Cancel</button>
				<button class="btn btn-primary" disabled={reporting}>{reporting ? 'Sending…' : 'Send report'}</button>
			</div>
		</form>
	{/if}
</dialog>

<ConfirmDialog open={!!deleteId} title="Remove your post?" confirmLabel="Remove post" cancelLabel="Keep it" danger busy={deleting} onconfirm={doDelete} oncancel={() => (deleteId = null)}>
	It will disappear from the community, along with its replies. This can’t be undone.
</ConfirmDialog>

<Toast open={toast.open} text={toast.text} icon={false} />

<style>
	.tab {
		min-height: 44px;
		margin-bottom: -1px;
		padding: 0;
		border: 0;
		border-bottom: 2px solid transparent;
		background: none;
		color: var(--color-muted);
		font: 500 14px var(--font-sans);
		transition: color var(--t2) var(--ease-out), border-color var(--t2) var(--ease-out);
	}
	.tab[aria-selected='true'] {
		color: var(--color-ink);
		border-bottom-color: var(--color-rose);
	}
	.radio {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 44px;
		padding: 0 14px;
		border: 1px solid var(--color-line);
		border-radius: 2px;
		font-size: 14px;
		color: var(--color-ink-2);
		cursor: pointer;
		transition: border-color var(--t2) var(--ease-out);
	}
	.radio:has(input:checked) {
		border-color: var(--color-espresso);
		background: var(--color-card);
	}
	dialog {
		width: calc(100% - 32px);
		max-width: 480px;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: var(--color-sheet);
		box-shadow: 0 40px 80px -40px rgb(43 37 34 / 0.55);
	}
</style>
