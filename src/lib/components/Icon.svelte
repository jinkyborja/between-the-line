<script lang="ts">
	import { icons, type IconName } from '#lib/icons.ts';

	let {
		name,
		size = 20,
		filled = false,
		label
	}: { name: IconName; size?: number; filled?: boolean; label?: string } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill={filled ? 'currentColor' : 'none'}
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden={label ? undefined : 'true'}
	role={label ? 'img' : undefined}
	aria-label={label}
	style="flex: none"
>
	<path d={icons[name]} />
</svg>
