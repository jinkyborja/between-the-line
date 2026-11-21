<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	let { value = $bindable(''), ...rest }: Omit<HTMLInputAttributes, 'type'> & { value?: string } = $props();
	let visible = $state(false);
</script>

<span class="pw">
	<input {...rest} class="field pw-input" type={visible ? 'text' : 'password'} bind:value />
	<button
		type="button"
		class="pw-toggle"
		aria-label={visible ? 'Hide password' : 'Show password'}
		aria-pressed={visible}
		onclick={() => (visible = !visible)}
	>
		<Icon name={visible ? 'eyeOff' : 'eye'} size={18} />
	</button>
</span>

<style>
	.pw {
		position: relative;
		display: block;
		font-weight: 400;
	}
	.pw-input {
		width: 100%;
		padding-right: 3rem;
	}
	.pw-toggle {
		position: absolute;
		top: 50%;
		right: 0.375rem;
		transform: translateY(-50%);
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 0.5rem;
		color: var(--color-mocha, #8c7568);
		background: transparent;
		transition: color 0.15s ease, background-color 0.15s ease;
	}
	.pw-toggle:hover {
		color: var(--color-espresso, #3b2d27);
		background: color-mix(in srgb, var(--color-mocha, #8c7568) 12%, transparent);
	}
	.pw-toggle:focus-visible {
		outline: 2px solid var(--color-mocha, #8c7568);
		outline-offset: 1px;
	}
</style>
