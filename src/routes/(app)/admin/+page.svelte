<script lang="ts">
	import { enhance } from '$app/forms';
	import { REPORT_REASONS } from '#lib/community.ts';
	import { ago } from '#lib/time.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;
</script>

<svelte:head><title>Moderation — Between the Lines</title></svelte:head>

<div class="flex flex-col gap-8">
	<header class="flex flex-col gap-3">
		<span class="eyebrow text-rose">Admins only</span>
		<h1 class="m-0 font-serif text-[42px] font-light tracking-[-0.025em] text-ink sm:text-[52px]">Moderation</h1>
		<p class="m-0 max-w-[620px] text-[15px] leading-relaxed text-muted">
			Reported community content. Authors appear only as an anonymous reference code, so you can spot repeat patterns without knowing who anyone is. Private journals are never visible here.
		</p>
	</header>

	<div role="tablist" aria-label="Report status" class="flex gap-7 border-b border-line">
		{#each [['open', 'Open'], ['actioned', 'Actioned'], ['dismissed', 'Dismissed']] as [k, label] (k)}
			<a role="tab" class="tab" aria-selected={data.status === k} href="?status={k}">{label}</a>
		{/each}
	</div>

	{#if form?.done}<p role="status" class="m-0 border border-[#C9D6C9] bg-[#EEF2EC] p-3 text-sm text-[#33493A]">{form.done}</p>{/if}
	{#if form?.message}<p role="alert" class="notice-err">{form.message}</p>{/if}
	{#if data.error}<p role="alert" class="notice-err">{data.error}</p>{/if}

	{#each data.items as r (r.report_id)}
		<article class="flex flex-col gap-4 border border-line bg-sheet p-6">
			<div class="flex flex-wrap items-center justify-between gap-3 text-xs text-subtle">
				<span class="flex flex-wrap items-center gap-2">
					<span class="rounded-full px-2.5 py-1 font-medium {r.reason === 'self_harm' ? 'bg-rose-tint text-rose-dark' : 'bg-skel text-body'}">{reasonLabel(r.reason)}</span>
					<span>{r.target_type} · reported {ago(r.reported_at)} · {r.reports_on_target} {r.reports_on_target === 1 ? 'report' : 'reports'}</span>
				</span>
				<span>Author ref <code class="font-mono text-ink">{r.author_ref}</code> · {r.author_prior_removals} prior removals{r.author_banned ? ' · paused' : ''}</span>
			</div>
			<p class="m-0 font-serif text-lg leading-[1.6] whitespace-pre-line text-ink-3">{r.target_body}</p>
			{#if r.details}<p class="m-0 border-l-2 border-line-strong pl-3 text-sm text-muted italic">Reporter note: {r.details}</p>{/if}
			<p class="m-0 text-xs text-subtle">Currently: <strong class="font-medium text-body">{r.target_status}</strong></p>

			<div class="flex flex-wrap gap-2 border-t border-line-soft pt-4">
				{#each [['removed', 'Remove', 'btn-danger'], ['hidden', 'Hide', 'btn-ghost'], ['visible', 'Keep visible', 'btn-ghost']] as [status, label, cls] (status)}
					<form method="POST" action="?/moderate" use:enhance>
						<input type="hidden" name="target_type" value={r.target_type} />
						<input type="hidden" name="target_id" value={r.target_id} />
						<input type="hidden" name="status" value={status} />
						<button class="btn {cls}">{label}</button>
					</form>
				{/each}
				{#if r.report_status === 'open'}
					<form method="POST" action="?/dismiss" use:enhance>
						<input type="hidden" name="report_id" value={r.report_id} />
						<button class="btn btn-ghost">Dismiss this report</button>
					</form>
				{/if}
				<form method="POST" action="?/ban" use:enhance class="ml-auto">
					<input type="hidden" name="target_type" value={r.target_type} />
					<input type="hidden" name="target_id" value={r.target_id} />
					<input type="hidden" name="banned" value={String(!r.author_banned)} />
					<button class="btn btn-ghost">{r.author_banned ? 'Restore community access' : 'Pause author’s community access'}</button>
				</form>
			</div>
		</article>
	{:else}
		<div class="flex flex-col items-center gap-3 border border-line bg-card px-8 py-16 text-center">
			<h3 class="m-0 font-serif text-2xl font-normal text-ink">Nothing to review.</h3>
			<p class="m-0 text-sm text-muted">The community is being gentle today.</p>
		</div>
	{/each}
</div>

<style>
	.tab {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		margin-bottom: -1px;
		border-bottom: 2px solid transparent;
		color: var(--color-muted);
		font: 500 14px var(--font-sans);
	}
	.tab[aria-selected='true'] {
		color: var(--color-ink);
		border-bottom-color: var(--color-rose);
	}
</style>
