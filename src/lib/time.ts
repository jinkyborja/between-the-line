/** Gentle relative time: "just now", "3h", "Yesterday", "Wed", "12 Nov". */
export function ago(iso: string, now = new Date()) {
	const d = new Date(iso);
	const s = (now.getTime() - d.getTime()) / 1000;
	if (s < 60) return 'just now';
	if (s < 3600) return `${Math.floor(s / 60)}m`;
	if (s < 86400) return `${Math.floor(s / 3600)}h`;
	if (s < 172800) return 'Yesterday';
	if (s < 604800) return d.toLocaleDateString('en-GB', { weekday: 'short' });
	return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const greeting = (h = new Date().getHours()) =>
	h < 5 ? 'Still awake' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
