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

	let liked = $derived(post.liked_by_me);
	let likes = $derived(post.likes_count);
	let commentsCount = $derived(post.comments_count);

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

<!-- Anonymous post: identity is always "Anonymous" (or "You" only to the author). -->
<article class="post surface rise" style="animation-delay: {delay}ms" aria-label="Anonymous reflection">
	<header class="flex items-start justify-between gap-3">
		<span class="flex min-w-0 items-center gap-3">
			<span class="anon" aria-hidden="true"><Icon name="community" size={17} /></span>
			<span class="flex min-w-0 flex-col gap-0.5">
				<span class="flex items-center gap-2 text-sm font-semibold text-ink">
					Anonymous{#if post.is_mine}<span class="badge badge-rose h-5! px-2! text-[10px]!">You</span>{/if}
				</span>
				<span class="truncate text-xs text-subtle">
					<time datetime={post.created_at}>{ago(post.created_at)}</time>{#if post.poem_title} · on <a href="/read/{post.poem_slug}" class="font-serif text-[13px] italic">{post.poem_title}</a>{/if}
				</span>
			</span>
		</span>
		<span class="badge flex-none">{post.category_name}</span>
	</header>

	<p class="m-0 max-w-[62ch] font-serif text-[18px] leading-[1.7] whitespace-pre-line text-ink-2 sm:text-[19px]">{post.body}</p>

	<footer class="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
		<div class="flex flex-wrap gap-1.5">
			<button class="react" class:felt={liked} aria-pressed={liked} onclick={toggleLike}>
				<span class="heart"><Icon name="heart" size={17} filled={liked} /></span>
				<span>{liked ? 'You felt this' : 'Felt this'}</span>
				<span class="n">{likes}</span>
			</button>
			<button class="react" aria-expanded={open} onclick={toggleComments}>
				<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" /></svg>
				<span>{open ? 'Hide replies' : 'Replies'}</span>
				<span class="n">{commentsCount}</span>
			</button>
		</div>
		{#if post.is_mine}
			<button class="btn btn-quiet btn-sm" onclick={() => ondelete(post.id)}><Icon name="trash" size={16} />Delete</button>
		{:else}
			<button class="icon-btn size-10!" aria-label="Report this reflection" title="Report" onclick={() => onreport({ postId: post.id })}><Icon name="flag" size={17} /></button>
		{/if}
	</footer>

	{#if open}
		<div class="replies">
			{#if comments === null}
				<div aria-busy="true" class="flex flex-col gap-2"><div class="skel h-3 w-24"></div><div class="skel h-3.5 w-3/4"></div></div>
			{:else}
				{#each comments as c (c.id)}
					<div class="reply">
						<span class="flex items-center justify-between gap-2 text-[13px]">
							<span class="font-semibold text-ink">{c.is_mine ? 'You' : 'Anonymous'} <span class="font-normal text-subtle">· {ago(c.created_at)}</span></span>
							{#if c.is_mine}
								<button class="mini" onclick={() => deleteComment(c.id)}>Delete</button>
							{:else}
								<button class="mini" aria-label="Report this reply" onclick={() => onreport({ commentId: c.id })}>Report</button>
							{/if}
						</span>
						<span class="text-[15px] leading-[1.6] whitespace-pre-line text-ink-3">{c.body}</span>
					</div>
				{:else}
					<p class="m-0 text-sm text-muted">No replies yet. Say something kind.</p>
				{/each}
			{/if}
			<form class="flex items-center gap-2 pt-1" onsubmit={sendReply}>
				<label class="sr-only" for="reply-{post.id}">Write a kind reply</label>
				<input id="reply-{post.id}" class="field" type="text" maxlength="1500" placeholder="Write something kind…" bind:value={reply} />
				<button class="btn btn-primary" disabled={!reply.trim() || sending}>{sending ? 'Sending…' : 'Reply'}</button>
			</form>
			<p class="m-0 flex items-center gap-1.5 text-xs text-subtle"><Icon name="lock" size={12} />Replies are anonymous too.</p>
		</div>
	{/if}
</article>

<style>
	.post {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 22px 20px 14px;
		transition:
			border-color var(--t3) var(--ease-out),
			box-shadow var(--t3) var(--ease-out);
	}
	@media (min-width: 640px) {
		.post {
			padding: 28px 30px 16px;
		}
	}
	.post:hover {
		border-color: var(--color-line-hover);
		box-shadow: var(--shadow-raised);
	}
	.anon {
		width: 38px;
		height: 38px;
		flex: none;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--color-beige);
		color: var(--color-mocha);
	}
	/* Reactions: soft pills with a count. */
	.react {
		min-height: 38px;
		padding: 0 12px;
		display: inline-flex;
		align-items: center;
		gap: 7px;
		border: 1px solid var(--color-line);
		border-radius: 999px;
		background: transparent;
		color: var(--color-body);
		font: 500 13px var(--font-sans);
		transition:
			color var(--t2) var(--ease-out),
			border-color var(--t2) var(--ease-out),
			background-color var(--t2) var(--ease-out);
	}
	.react:hover {
		border-color: var(--color-line-hover);
		color: var(--color-ink);
	}
	.react .n {
		min-width: 14px;
		color: var(--color-subtle);
		font-variant-numeric: tabular-nums;
	}
	.react.felt {
		color: var(--color-rose-dark);
		background: var(--color-rose-tint);
		border-color: var(--color-dusty);
	}
	.react.felt .n {
		color: var(--color-rose);
	}
	.heart {
		display: inline-flex;
	}
	.react.felt .heart {
		animation: pop var(--t3) var(--ease-out);
	}
	@keyframes pop {
		45% {
			transform: scale(1.15);
		}
	}
	.replies {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin: 2px 0 6px;
		padding: 16px 16px 14px;
		background: var(--color-paper);
		border-radius: 2px;
		animation: pageIn var(--t3) var(--ease-out);
	}
	.reply {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-left: 12px;
		border-left: 2px solid var(--color-line-strong);
	}
	.mini {
		min-height: 28px;
		padding: 0 6px;
		border: 0;
		background: none;
		color: var(--color-subtle);
		font: 400 12px var(--font-sans);
	}
	.mini:hover {
		color: var(--color-ink);
	}
	@media (prefers-reduced-motion: reduce) {
		.react.felt .heart {
			animation: none;
		}
	}
</style>
