<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		// Keep server-rendered data in step with sign-in / sign-out in any tab.
		const { data: sub } = data.supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) invalidate('supabase:auth');
		});
		return () => sub.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Between the Lines</title>
	<meta
		name="description"
		content="Some feelings are difficult to explain. Here, you don't have to. Just write."
	/>
</svelte:head>

{@render children()}
