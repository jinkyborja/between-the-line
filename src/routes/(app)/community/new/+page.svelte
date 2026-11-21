<script lang="ts">
	import { enhance } from '$app/forms';
	import { untrack } from 'svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { GUIDELINES } from '#lib/community.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let body = $state(untrack(() => form?.body ?? ''));
	let category = $state(untrack(() => form?.category ?? data.poem?.category?.slug ?? ''));
	let ack = $state(false);
	let confirming = $state(false);
	let busy = $state(false);
	let formEl = $state<HTMLFormElement>();
	const ready = $derived(body.trim().length > 0 && !!category && ack);
</script>

<svelte:head><title>Share anonymously — Between the Lines</title></svelte:head>

<div class="flex flex-wrap items-start gap-12">
	<form
		bind:this={formEl}
		method="POST"
		class="flex min-w-0 flex-[999_1_520px] flex-col gap-6"
		onsubmit={(e) => {
			if (!confirming) {
				e.preventDefault();
				if (ready) confirming = true;
			}
		}}
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
				confirming = false;
			};
		}}
	>
		<a href="/community" class="text-sm font-medium">← Community</a>
		<header class="flex flex-col gap-3">
			<span class="inline-flex h-[30px] items-center gap-2 self-start rounded-full bg-[#EAE3D9] px-3 text-xs font-medium text-body">
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 3l18 18M10.6 6.1A9.9 9.9 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-3 3.4M6.6 6.6C4.3 8.1 3 12 3 12s4 6 9 6a8.8 8.8 0 0 0 3.4-.7" /></svg>
				Anonymous — no name, photo or profile
			</span>
			<h1 class="m-0 font-serif text-[38px] font-light tracking-[-0.025em] text-ink sm:text-[46px]">Share with the community</h1>
			<p class="m-0 max-w-[560px] text-[15px] leading-relaxed text-muted">
				This is a new, separate post — nothing from your private journal is copied here. Write only what you’re comfortable sharing.
			</p>
		</header>

		{#if data.poem}
			<input type="hidden" name="poem_id" value={data.poem.id} />
			<p class="m-0 text-sm text-subtle">On <a href="/read/{data.poem.slug}" class="font-serif text-[15px] italic">{data.poem.title}</a> — {data.poem.author}</p>
		{/if}

		<div class="sheet flex flex-col gap-3 border border-line bg-sheet px-6 py-8 sm:px-12 sm:py-10">
			<label class="sr-only" for="body">Your anonymous reflection</label>
			<textarea
				id="body"
				name="body"
				bind:value={body}
				maxlength="4000"
				rows="10"
				placeholder="What did it stir in you?"
				class="min-h-[260px] resize-y border-0 bg-transparent p-0 font-serif text-xl leading-[1.75] text-[#2E2622] outline-none placeholder:text-faint"
			></textarea>
			<span class="self-end text-xs text-subtle">{body.length.toLocaleString('en-GB')} / 4,000</span>
		</div>

		<fieldset class="m-0 flex flex-col gap-3 border-0 p-0">
			<legend class="eyebrow mb-3 text-subtle">Which feeling does it belong to?</legend>
			<div class="flex flex-wrap gap-2">
				{#each data.categories as c (c.id)}
					<label class="chip cursor-pointer has-[:checked]:border-espresso has-[:checked]:bg-espresso has-[:checked]:text-cream">
						<input class="sr-only" type="radio" name="category" value={c.slug} bind:group={category} />{c.name}
					</label>
				{/each}
			</div>
		</fieldset>

		<label class="flex items-start gap-3 text-sm leading-relaxed text-ink-2">
			<input type="checkbox" name="ack" bind:checked={ack} class="mt-0.5 size-[18px] flex-none accent-espresso" />
			I haven’t included names, places or details that could identify me or anyone else.
		</label>

		{#if form?.message}<p role="alert" class="notice-err">{form.message}</p>{/if}

		<div class="flex flex-wrap gap-3">
			<button class="btn btn-rose" disabled={!ready || busy}>Share anonymously</button>
			<a class="btn btn-ghost" href="/community">Not now</a>
		</div>
	</form>

	<aside class="flex min-w-0 flex-[1_1_280px] flex-col gap-6">
		<div class="flex flex-col gap-3.5 bg-espresso p-7 text-cream-2">
			<span class="eyebrow text-rose-soft">How we hold each other</span>
			<ul class="m-0 flex list-none flex-col gap-3 p-0 font-serif text-[17px] leading-[1.45]">
				{#each GUIDELINES as g (g)}<li>{g}</li>{/each}
			</ul>
		</div>
		<div class="flex gap-2.5 border border-line bg-sand p-4 text-[13px] leading-[1.55] text-ink-3">
			<span class="mt-0.5"><Icon name="shield" size={16} /></span>
			<span>Other readers never see who wrote this. To keep the space safe, moderators can act on a post without learning your name or email.</span>
		</div>
	</aside>
</div>

<ConfirmDialog
	open={confirming && !busy}
	title="Share with the community?"
	confirmLabel="Share anonymously"
	cancelLabel="Not yet"
	busy={busy}
	onconfirm={() => formEl?.requestSubmit()}
	oncancel={() => (confirming = false)}
>
	It will appear in Community without your name or photo. You can remove it later from “Your posts”.
</ConfirmDialog>
