import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Add or remove a bookmark as the signed-in user.
 * user_id is filled in by the database default and checked by RLS.
 */
export async function setBookmark(supabase: SupabaseClient, poemId: string, on: boolean) {
	const { error } = on
		? await supabase.from('bookmarks').upsert({ poem_id: poemId }, { onConflict: 'user_id,poem_id', ignoreDuplicates: true })
		: await supabase.from('bookmarks').delete().eq('poem_id', poemId);
	return !error;
}
