<script lang="ts">
	import { page } from '$app/state';
	const notFound = $derived(page.status === 404);
</script>

<!-- Errors inside the app keep the sidebar/bottom nav around them. -->
<div class="flex flex-col items-center gap-4 border border-line bg-card px-8 py-16 text-center">
	<svg width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M4 28c14-14 24 6 36-4s18-16 28-4 20 10 30 0 12-8 18-6" /></svg>
	<h1 class="m-0 font-serif text-3xl font-light text-ink">{notFound ? 'There’s nothing written here.' : 'This page has gone quiet.'}</h1>
	<p class="m-0 max-w-[380px] text-sm leading-relaxed text-muted">
		{notFound ? (page.error?.message ?? 'We couldn’t find that page.') : 'Something went wrong. Your words are safe — please try again.'}
	</p>
	<div class="flex flex-wrap justify-center gap-3">
		{#if !notFound}<button class="btn btn-primary" onclick={() => location.reload()}>Try again</button>{/if}
		<a class="btn btn-ghost" href="/discover">Go to Discover</a>
	</div>
</div>
