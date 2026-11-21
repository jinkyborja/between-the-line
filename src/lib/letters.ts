import type { LetterKind } from './types.ts';

export const LETTER_KINDS: {
	kind: LetterKind;
	label: string;
	short: string;
	salutation: string;
	line: string;
	prompts: string[];
}[] = [
	{
		kind: 'past',
		label: 'To My Past Self',
		short: 'Past self',
		salutation: 'Dear younger me,',
		line: 'For who you were, and what you couldn’t know yet.',
		prompts: [
			'What do you wish you could tell them on their hardest day?',
			'What are you proud they survived?',
			'What can you finally forgive them for?',
			'What did they get right, that no one noticed?'
		]
	},
	{
		kind: 'present',
		label: 'To My Present Self',
		short: 'Present self',
		salutation: 'Dear me, right now,',
		line: 'For the person reading this today.',
		prompts: [
			'What are you carrying that you haven’t said out loud?',
			'What do you need to hear today?',
			'What would being gentle with yourself look like this week?',
			'What small thing is going right?'
		]
	},
	{
		kind: 'future',
		label: 'To My Future Self',
		short: 'Future self',
		salutation: 'Dear future me,',
		line: 'For someone you haven’t met yet.',
		prompts: [
			'What do you hope has changed by the time you read this?',
			'What do you hope has stayed exactly the same?',
			'What are you afraid of right now — and do you think it will matter then?',
			'What promise do you want to make to them?'
		]
	},
	{
		kind: 'unsent',
		label: 'Letters Never Sent',
		short: 'Never sent',
		salutation: 'Dear',
		line: 'For the people you have things left unsaid to.',
		prompts: [
			'What did you never get the chance to say?',
			'What do you wish they understood about you?',
			'What are you still holding that belongs to them?',
			'If this were the last thing you ever said to them, what would it be?'
		]
	}
];

export const kindOf = (k: LetterKind) => LETTER_KINDS.find((x) => x.kind === k)!;

export const salutationFor = (k: LetterKind, recipient: string | null) =>
	k === 'unsent' ? `Dear ${recipient?.trim() || '…'},` : kindOf(k).salutation;

export const longDate = (iso: string | Date) =>
	new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
