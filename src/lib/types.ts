/** Row shapes the app reads. Community types come from the anonymous views only. */

export type Mood = 'tender' | 'aching' | 'hopeful' | 'restless' | 'grateful' | 'numb' | 'lighter' | 'unsure';
export const MOODS: Mood[] = ['tender', 'aching', 'hopeful', 'restless', 'grateful', 'numb', 'lighter', 'unsure'];

export interface Profile {
	id: string;
	display_name: string;
	bio: string | null;
	role: 'member' | 'admin';
	theme: 'light' | 'dark' | 'system';
	text_size: 'S' | 'M' | 'L';
	community_banned_at: string | null;
	created_at: string;
}

export interface Category {
	id: number;
	slug: string;
	name: string;
	description: string | null;
	sort_order: number;
}

export interface Poem {
	id: string;
	slug: string;
	kind: 'poem' | 'quote';
	title: string;
	body: string;
	author: string;
	category_id: number;
	reflection_prompts: string[];
	reading_minutes: number;
	is_featured: boolean;
	featured_on: string | null;
	created_at: string;
}

/** A poem shaped for cards and lists (category flattened to its name). */
export interface CardPoem {
	id: string;
	slug: string;
	kind: 'poem' | 'quote';
	title: string;
	author: string;
	body: string;
	category: string;
	category_slug: string;
	created_at: string;
}

export interface Reflection {
	id: string;
	poem_id: string | null;
	title: string | null;
	body: string;
	moods: Mood[];
	tags: string[];
	status: 'draft' | 'saved';
	created_at: string;
	updated_at: string;
}

/** From the `community_feed` view — deliberately has no author fields. */
export interface CommunityPost {
	id: string;
	body: string;
	category_id: number;
	category_slug: string;
	category_name: string;
	poem_id: string | null;
	poem_slug: string | null;
	poem_title: string | null;
	likes_count: number;
	comments_count: number;
	created_at: string;
	is_mine: boolean;
	liked_by_me: boolean;
}

/** From the `community_comment_feed` view. */
export interface CommunityComment {
	id: string;
	post_id: string;
	body: string;
	created_at: string;
	is_mine: boolean;
}

export interface Notification {
	id: string;
	type: 'comment' | 'appreciation' | 'post_hidden' | 'comment_hidden' | 'report_resolved' | 'letter_reminder';
	post_id: string | null;
	comment_id: string | null;
	letter_id?: string | null;
	read_at: string | null;
	created_at: string;
}

export type ReportReason = 'harassment' | 'hate' | 'self_harm' | 'identifying_info' | 'spam' | 'other';

export type LetterKind = 'past' | 'present' | 'future' | 'unsent';

/** A private letter. Owner-only in the database; never shared or listed publicly. */
export interface Letter {
	id: string;
	kind: LetterKind;
	recipient: string | null;
	title: string | null;
	body: string;
	status: 'draft' | 'complete';
	archived_at: string | null;
	remind_on: string | null;
	reminded_at: string | null;
	created_at: string;
	updated_at: string;
}
