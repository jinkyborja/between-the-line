<script lang="ts">
	let { password }: { password: string } = $props();

	const score = $derived.by(() => {
		if (!password) return 0;
		let s = 0;
		if (password.length >= 10) s++;
		if (password.length >= 14) s++;
		if (/\d/.test(password) && /[a-zA-Z]/.test(password)) s++;
		if (/[^a-zA-Z0-9]/.test(password) || /[A-Z]/.test(password)) s++;
		return password.length < 10 ? Math.min(s, 1) : Math.max(s, 1);
	});
	const label = $derived(
		password.length === 0
			? 'At least 10 characters'
			: password.length < 10
				? `Too short — ${password.length} of 10 characters`
				: ['', 'Okay', 'Good', 'Strong', 'Very strong'][score] + ` — ${password.length} characters`
	);
	const color = $derived(password.length < 10 ? '#8E3A40' : score >= 3 ? '#4F6B55' : '#8A6A2E');
</script>

<div class="flex flex-col gap-2">
	<div aria-hidden="true" class="grid grid-cols-4 gap-1">
		{#each [1, 2, 3, 4] as i (i)}
			<span
				class="h-[3px] transition-colors duration-[240ms]"
				style="background: {i <= score ? color : '#E4DACD'}"
			></span>
		{/each}
	</div>
	<span class="text-[13px]" style="color: {password ? color : '#6F625A'}" aria-live="polite">{label}</span>
</div>
