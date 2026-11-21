<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open,
		title,
		confirmLabel,
		cancelLabel = 'Cancel',
		danger = false,
		busy = false,
		onconfirm,
		oncancel,
		children
	}: {
		open: boolean;
		title: string;
		confirmLabel: string;
		cancelLabel?: string;
		danger?: boolean;
		busy?: boolean;
		onconfirm: () => void;
		oncancel: () => void;
		children: Snippet;
	} = $props();

	let el = $state<HTMLDialogElement>();

	// Native <dialog>: focus trap, Esc to close and inert background for free.
	$effect(() => {
		if (!el) return;
		if (open && !el.open) el.showModal();
		if (!open && el.open) el.close();
	});
</script>

<dialog
	bind:this={el}
	aria-labelledby="dlg-title"
	oncancel={(e) => {
		e.preventDefault();
		oncancel();
	}}
	onclick={(e) => e.target === el && oncancel()}
>
	<div class="flex flex-col gap-4 p-7 sm:p-9">
		<h3 id="dlg-title" class="m-0 font-serif text-[26px] font-normal text-ink">{title}</h3>
		<div class="text-[15px] leading-relaxed text-muted">{@render children()}</div>
		<div class="mt-2 flex flex-wrap justify-end gap-2.5">
			<!-- Focus the safe choice when the modal opens. -->
			<!-- svelte-ignore a11y_autofocus -->
			<button class="btn btn-ghost" onclick={oncancel} autofocus>{cancelLabel}</button>
			<button class="btn {danger ? 'btn-danger' : 'btn-primary'}" onclick={onconfirm} disabled={busy}>{busy ? 'One moment…' : confirmLabel}</button>
		</div>
	</div>
</dialog>

<style>
	dialog {
		width: calc(100% - 32px);
		max-width: 440px;
		padding: 0;
		border: 0;
		border-radius: 6px;
		background: var(--color-sheet);
		box-shadow: 0 40px 80px -40px rgb(43 37 34 / 0.55);
		opacity: 0;
		transform: translateY(12px) scale(0.985);
		transition:
			opacity var(--t2) var(--ease-out),
			transform var(--t3) var(--ease-out),
			overlay var(--t2) allow-discrete,
			display var(--t2) allow-discrete;
	}
	dialog[open] {
		opacity: 1;
		transform: none;
	}
	@starting-style {
		dialog[open] {
			opacity: 0;
			transform: translateY(12px) scale(0.985);
		}
	}
	dialog::backdrop {
		background: rgb(43 37 34 / 0.38);
	}
</style>
