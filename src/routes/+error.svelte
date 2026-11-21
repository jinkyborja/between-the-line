<script lang="ts">
	import { page } from '$app/state';
	import Wordmark from '#lib/components/Wordmark.svelte';

	const notFound = $derived(page.status === 404);
</script>

<svelte:head><title>{notFound ? 'Not found' : 'Something went wrong'} — Between the Lines</title></svelte:head>

<div class="page-in mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center gap-5 px-6 text-center">
	<Wordmark size={22} />
	<svg width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M4 28c14-14 24 6 36-4s18-16 28-4 20 10 30 0 12-8 18-6" /></svg>
	<h1 class="m-0 font-serif text-[34px] font-light text-ink">{notFound ? 'There’s nothing written here.' : 'This page has gone quiet.'}</h1>
	<p class="m-0 text-muted">
		{notFound ? 'The page you were looking for doesn’t exist, or was moved.' : 'Something went wrong on our side. Your words are safe — please try again.'}
	</p>
	<div class="flex flex-wrap justify-center gap-3">
		{#if !notFound}<button class="btn btn-primary" onclick={() => location.reload()}>Try again</button>{/if}
		<a class="btn btn-ghost" href="/discover">Go to Discover</a>
	</div>
</div>
