<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="mx-auto flex min-h-screen max-w-[560px] flex-col items-center justify-center gap-4 px-6 text-center">
	<svg width="120" height="40" viewBox="0 0 120 40" fill="none" stroke="#B9A999" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M4 28c14-14 24 6 36-4s18-16 28-4 20 10 30 0 12-8 18-6" /></svg>
	<h1 class="m-0 font-serif text-[32px] font-light text-ink">This page has gone quiet.</h1>
	<p class="m-0 text-muted">{page.error?.message ?? 'Something went wrong.'}</p>
	<a class="btn btn-ghost" href="/library">Back to the library</a>
</div>
