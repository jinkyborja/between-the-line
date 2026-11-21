/** Small reactive toast controller: show(text, undo?) → auto-hides after ~3s. */
export function createToast(ms = 3200) {
	let open = $state(false);
	let text = $state('');
	let undo = $state<(() => void) | undefined>(undefined);
	let timer: ReturnType<typeof setTimeout> | undefined;

	return {
		get open() {
			return open;
		},
		get text() {
			return text;
		},
		get undo() {
			return undo;
		},
		show(t: string, onUndo?: () => void) {
			text = t;
			undo = onUndo
				? () => {
						clearTimeout(timer);
						open = false;
						onUndo();
					}
				: undefined;
			open = true;
			clearTimeout(timer);
			timer = setTimeout(() => (open = false), ms);
		},
		hide() {
			clearTimeout(timer);
			open = false;
		}
	};
}
