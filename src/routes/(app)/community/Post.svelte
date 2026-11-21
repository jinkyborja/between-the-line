<script lang="ts">
	import type { SupabaseClient } from '@supabase/supabase-js';
	import Icon from '#lib/components/Icon.svelte';
	import { friendlyError } from '#lib/community.ts';
	import { ago } from '#lib/time.ts';
	import type { CommunityComment, CommunityPost } from '#lib/types.ts';

	let {
		post,
		supabase,
		delay = 0,
		onreport,
		ondelete,
		onerror
	}: {
		post: CommunityPost;
		supabase: SupabaseClient;
		delay?: number;
		onreport: (target: { postId?: string; commentId?: string }) => void;
		ondelete: (id: string) => void;
		onerror: (msg: string) => void;
	} = $props();

	let liked = $state(false);
	let likes = $state(0);
	let commentsCount = $state(0);
	$effect.pre(() => {
		liked = post.liked_by_me;
		likes = post.likes_count;
		commentsCount = post.comments_count;
	});

	let open = $state(false);
	let comments = $state<CommunityComment[] | null>(null);
	let reply = $state('');
	let sending = $state(false);
	let liking = false;

	async function toggleLike() {
		if (liking) return;
		liking = true;
		const was = liked;
		liked = !was;
		likes += was ? -1 : 1;
		const { data, error } = await supabase.rpc('toggle_community_like', { p_post_id: post.id }).single<{ liked: boolean; likes_count: number }>();
		liking = false;
		if (error || !data) {
			liked = was;
			likes += was ? 1 : -1;
			return onerror(friendlyError(error?.message));
		}
		liked = data.liked;
		likes = data.likes_count;
	}

	async function loadComments() {
		const { data, error } = await supabase
			.from('community_comment_feed')
			.select('*')
			.eq('post_id', post.id)
			.order('created_at')
			.limit(200)
			.returns<CommunityComment[]>();
		if (error) return onerror('Replies didn’t load. Please try again.');
		comments = data;
		commentsCount = data.length;
	}

	async function toggleComments() {
		open = !open;
		if (open && !comments) await loadComments();
	}

	async function sendReply(e: SubmitEvent) {
		e.preventDefault();
		const text = reply.trim();
		if (!text || sending) return;
		sending = true;
		const { error } = await supabase.rpc('create_community_comment', { p_post_id: post.id, p_body: text });
		sending = false;
		if (error) return onerror(friendlyError(error.message));
		reply = '';
		await loadComments();
	}

	async function deleteComment(id: string) {
		const { error } = await supabase.rpc('delete_community_comment', { p_comment_id: id });
		if (error) return onerror(friendlyError(error.message));
		await loadComments();
	}
</script>

<article class="post rise flex flex-col gap-4.5 border border-line bg-sheet p-6 sm:p-8" style="animation-delay: {delay}ms">
	<header class="flex items-center justify-between gap-3">
		<span class="flex items-center gap-3">
			<span class="inline-flex size-10 flex-none items-center justify-center rounded-full bg-[#EAE3D9] text-body" aria-hidden="true"><Icon name="community" size={18} /></span>
			<span class="flex flex-col gap-0.5">
				<span class="text-sm font-semibold text-ink">{post.is_mine ? 'Anonymous · you' : 'Anonymous'}</span>
				<span class="text-xs text-subtle">
					{ago(post.created_at)}{#if post.poem_title} · on <a href="/read/{post.poem_slug}" class="font-serif text-[13px] italic">{post.poem_title}</a>{/if}
				</span>
			</span>
		</span>
		<span class="eyebrow tracking-[0.16em] text-subtle">{post.category_name}</span>
	</header>

	<p class="m-0 font-serif text-[19px] leading-[1.65] whitespace-pre-line text-[#2E2622] sm:text-xl">{post.body}</p>

	<footer class="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3.5">
		<div class="flex flex-wrap gap-1">
			<button class="act" class:felt={liked} aria-pressed={liked} onclick={toggleLike}>
				<span class="heart"><Icon name="heart" size={18} filled={liked} /></span>{likes} felt this
			</button>
			<button class="act" aria-expanded={open} onclick={toggleComments}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /></svg>
				{commentsCount} {commentsCount === 1 ? 'reply' : 'replies'}
			</button>
		</div>
		{#if post.is_mine}
			<button class="act" onclick={() => ondelete(post.id)}><Icon name="trash" size={18} />Delete</button>
		{:else}
			<button class="act" aria-label="Report this reflection" onclick={() => onreport({ postId: post.id })}><Icon name="flag" size={18} /></button>
		{/if}
	</footer>

	{#if open}
		<div class="replies flex flex-col gap-3.5 bg-paper p-5">
			{#if comments === null}
				<div class="skel h-3.5 w-1/2"></div>
			{:else}
				{#each comments as c (c.id)}
					<div class="group flex flex-col gap-1">
						<span class="flex items-center justify-between gap-2 text-[13px] font-semibold text-ink">
							<span>{c.is_mine ? 'You' : 'Anonymous'} <span class="font-normal text-subtle">· {ago(c.created_at)}</span></span>
							{#if c.is_mine}
								<button class="mini" onclick={() => deleteComment(c.id)}>Delete</button>
							{:else}
								<button class="mini" aria-label="Report this reply" onclick={() => onreport({ commentId: c.id })}>Report</button>
							{/if}
						</span>
						<span class="text-[15px] leading-[1.55] whitespace-pre-line text-ink-3">{c.body}</span>
					</div>
				{:else}
					<p class="m-0 text-sm text-muted">No replies yet. Say something kind.</p>
				{/each}
			{/if}
			<form class="flex items-center gap-2" onsubmit={sendReply}>
				<label class="sr-only" for="reply-{post.id}">Write a kind reply</label>
				<input id="reply-{post.id}" class="field" type="text" maxlength="1500" placeholder="Write something kind…" bind:value={reply} />
				<button class="btn btn-primary" disabled={!reply.trim() || sending}>{sending ? '…' : 'Reply'}</button>
			</form>
			<p class="m-0 text-xs text-subtle">Replies are anonymous too.</p>
		</div>
	{/if}
</article>

<style>
	.post {
		transition: border-color var(--t3) var(--ease-out), box-shadow var(--t3) var(--ease-out);
	}
	.post:hover {
		border-color: var(--color-line-hover);
		box-shadow: 0 18px 40px -30px rgb(63 50 43 / 0.4);
	}
	.act {
		min-height: 40px;
		padding: 0 10px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid transparent;
		border-radius: 2px;
		background: transparent;
		color: var(--color-body);
		font: 500 13px var(--font-sans);
		transition: color var(--t2) var(--ease-out), border-color var(--t2) var(--ease-out), background-color var(--t2) var(--ease-out);
	}
	.act:hover {
		border-color: var(--color-line-strong);
		color: var(--color-ink);
	}
	.act.felt {
		color: var(--color-rose);
		background: var(--color-rose-tint);
	}
	.act.felt .heart {
		animation: pop var(--t3) var(--ease-out);
	}
	.heart {
		display: inline-flex;
	}
	@keyframes pop {
		45% {
			transform: scale(1.15);
		}
	}
	.mini {
		min-height: 28px;
		padding: 0 6px;
		border: 0;
		background: none;
		color: var(--color-subtle);
		font: 400 12px var(--font-sans);
		opacity: 0.7;
	}
	.mini:hover {
		color: var(--color-ink);
		opacity: 1;
	}
	.replies {
		animation: pageIn var(--t3) var(--ease-out);
	}
</style>
