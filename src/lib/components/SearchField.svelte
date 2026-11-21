<script lang="ts">
	import Icon from './Icon.svelte';

	let {
		value = $bindable(''),
		label,
		placeholder,
		name = 'q',
		oninput
	}: { value?: string; label: string; placeholder: string; name?: string; oninput?: () => void } = $props();
</script>

<label class="relative block">
	<span class="pointer-events-none absolute top-[13px] left-3.5 text-subtle"><Icon name="search" /></span>
	<span class="sr-only">{label}</span>
	<input class="field pl-[42px]!" type="search" {name} {placeholder} bind:value {oninput} autocomplete="off" />
</label>
