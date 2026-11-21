import type { ReportReason } from './types.ts';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
	{ value: 'self_harm', label: 'The writer may be in danger' },
	{ value: 'harassment', label: 'Unkind or harassing' },
	{ value: 'hate', label: 'Hateful toward a group of people' },
	{ value: 'identifying_info', label: 'Shares someone’s private or identifying information' },
	{ value: 'spam', label: 'Spam or self-promotion' },
	{ value: 'other', label: 'Something else' }
];

export const GUIDELINES = [
	'Respond to the feeling, not the grammar.',
	'No advice unless someone asks for it.',
	'Anonymous means anonymous. Don’t guess, and don’t share details that could identify you or anyone else.',
	'If someone seems unsafe, report it — we’ll reach out gently.'
];

/** Turn database function errors into calm, human messages. */
export function friendlyError(message?: string) {
	if (!message) return 'Something went wrong. Please try again.';
	if (/wait a little|too many/i.test(message)) return message.replace(/^.*?(Please|Too)/, '$1') + '.';
	if (/paused/i.test(message)) return 'Community access is paused for this account. Your journal is still yours.';
	if (/not found/i.test(message)) return 'That post is no longer available.';
	return 'Something went wrong. Please try again.';
}
