// Runs the migrations + seed on in-memory Postgres with a minimal Supabase auth stub,
// then checks the privacy and anonymity rules as real client roles.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2];
const db = new PGlite();
let pass = 0, failN = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ', m); } else { failN++; console.log('  FAIL', m); } };

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create schema extensions;
  grant usage on schema public, auth to anon, authenticated;
  create table auth.users (id uuid primary key, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant execute on function auth.uid() to anon, authenticated;
  -- emulate Supabase's permissive defaults so our revokes are actually tested
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);

const migDir = join(root, 'supabase/migrations');
for (const f of readdirSync(migDir).sort()) {
  await db.exec(readFileSync(join(migDir, f), 'utf8'));
  console.log('applied', f);
}
await db.exec(readFileSync(join(root, 'supabase/seed.sql'), 'utf8'));
await db.exec(readFileSync(join(root, 'supabase/seed.sql'), 'utf8')); // re-runnable
console.log('seeded (twice)');

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const ADM = '00000000-0000-0000-0000-0000000000ad';
await db.exec(`
  insert into auth.users (id, raw_user_meta_data) values
   ('${A}', '{"display_name":"Amelia"}'), ('${B}', '{}'), ('${ADM}', '{"display_name":"Mod"}');
  update public.profiles set role = 'admin' where id = '${ADM}';
`);

async function as(uid, sql, params) {
  await db.exec('reset role');
  if (uid === 'anon') { await db.exec(`set role anon; select set_config('request.jwt.claim.sub', '', false)`); }
  else { await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false)`); }
  try { return { rows: (await db.query(sql, params)).rows }; }
  catch (e) { return { error: e.message }; }
  finally { await db.exec('reset role'); }
}

console.log('\nprofiles');
let r = await as(A, `select id, display_name, role from public.profiles`);
ok(r.rows?.length === 1 && r.rows[0].display_name === 'Amelia', 'trigger created profile; user sees only own row');
r = await as(A, `update public.profiles set role = 'admin' where id = '${A}'`);
ok(!!r.error, 'cannot promote self to admin (' + (r.error ?? 'no error') + ')');
r = await as(A, `update public.profiles set display_name = 'Amy' where id = '${B}' returning id`);
ok(r.rows?.length === 0, "cannot edit someone else's profile");

console.log('\npoems');
r = await as('anon', `select count(*)::int n from public.poems`);
ok(r.rows?.[0].n === 15, 'anon can read 15 published poems');
r = await as(A, `insert into public.poems (slug,title,body,author,category_id) values ('x','x','x','x',1)`);
ok(!!r.error, 'members cannot write poems');
r = await as(A, `select title from public.poems where search @@ websearch_to_tsquery('english','kettle')`);
ok(r.rows?.length === 1, 'full-text search finds poem');

console.log('\nprivate journal');
r = await as(A, `insert into public.reflections (title, body, moods, tags) values ('Mine','secret text','{tender}','{grief}') returning id, user_id`);
ok(r.rows?.[0]?.user_id === A, 'owner can create; user_id stamped by default');
const refId = r.rows?.[0]?.id;
r = await as(A, `insert into public.reflections (user_id, body) values ('${B}', 'forged')`);
ok(!!r.error, 'cannot write a reflection as someone else');
r = await as(B, `select * from public.reflections`);
ok(r.rows?.length === 0, 'other member sees no reflections');
r = await as(ADM, `select * from public.reflections`);
ok(r.rows?.length === 0, 'ADMIN sees no reflections');
r = await as(B, `update public.reflections set body = 'x' where id = '${refId}' returning id`);
ok(r.rows?.length === 0, 'other member cannot edit');
r = await as(B, `delete from public.reflections where id = '${refId}' returning id`);
ok(r.rows?.length === 0, 'other member cannot delete');
r = await as(A, `update public.reflections set status = 'saved' where id = '${refId}' returning status`);
ok(r.rows?.[0]?.status === 'saved', 'owner can update');

console.log('\nbookmarks');
r = await as(A, `insert into public.bookmarks (poem_id) select id from public.poems where slug='unsent' returning user_id`);
ok(r.rows?.[0]?.user_id === A, 'bookmark created');
r = await as(B, `select * from public.bookmarks`);
ok(r.rows?.length === 0, "can't see others' bookmarks");

console.log('\nanonymous community');
r = await as(A, `select * from public.community_posts`);
ok(!!r.error, 'direct table read denied (' + (r.error ?? '') + ')');
r = await as(A, `insert into public.community_posts (author_id, category_id, body) values ('${A}', 1, 'x')`);
ok(!!r.error, 'direct table insert denied');
r = await as(A, `select public.create_community_post('Shared, anonymously.', 'healing') as id`);
const postId = r.rows?.[0]?.id;
ok(!!postId, 'post created via function');
r = await as(A, `select count(*)::int n from public.reflections`);
ok(r.rows?.[0].n === 1, 'posting did not touch the journal');
r = await as(B, `select * from public.community_feed`);
ok(r.rows?.length === 1, 'other member sees the post in the feed');
const cols = Object.keys(r.rows?.[0] ?? {});
ok(!cols.some((c) => /author|user|email|name$/.test(c) && c !== 'category_name'), 'feed has no identifying columns: ' + cols.join(','));
ok(r.rows?.[0].is_mine === false, 'is_mine false for others');
r = await as(A, `select is_mine from public.community_feed`);
ok(r.rows?.[0].is_mine === true, 'is_mine true for author');
r = await as('anon', `select * from public.community_feed`);
ok(!!r.error || r.rows.length === 0, 'anon cannot read the feed');

r = await as(B, `select * from public.toggle_community_like('${postId}')`);
ok(r.rows?.[0].liked === true && r.rows?.[0].likes_count === 1, 'like toggles on, count 1');
r = await as(B, `select * from public.toggle_community_like('${postId}')`);
ok(r.rows?.[0].liked === false && r.rows?.[0].likes_count === 0, 'like toggles off, count 0');
await as(B, `select * from public.toggle_community_like('${postId}')`);

r = await as(B, `select public.create_community_comment('${postId}', 'Thank you for this.') id`);
const commentId = r.rows?.[0]?.id;
ok(!!commentId, 'comment created');
r = await as(A, `select * from public.community_comment_feed`);
ok(r.rows?.length === 1 && !Object.keys(r.rows[0]).some((c) => /author|user/.test(c)), 'comment feed anonymous');
r = await as(A, `select comments_count from public.community_feed`);
ok(r.rows?.[0].comments_count === 1, 'comment count maintained');

r = await as(A, `select type, post_id from public.notifications order by type`);
ok(r.rows?.length === 2 && r.rows.every((n) => !('actor_id' in n)), 'author got comment + appreciation notifications (no actor)');
r = await as(B, `select * from public.notifications`);
ok(r.rows?.length === 0, "can't see others' notifications");

r = await as(B, `select public.delete_community_post('${postId}')`);
ok(!!r.error, "can't delete someone else's post");

console.log('\nreports & moderation');
r = await as(B, `select public.report_content('harassment', '${postId}', null, 'test')`);
ok(!r.error, 'report filed');
r = await as(B, `select public.report_content('harassment', '${postId}', null, 'again')`);
ok(!r.error, 'duplicate report is a no-op');
r = await as(B, `select * from public.reports`);
ok(!!r.error, 'members cannot read reports table');
r = await as(A, `select * from public.admin_report_queue()`);
ok(!!r.error, 'members cannot open the moderation queue');
r = await as(ADM, `select * from public.admin_report_queue()`);
ok(r.rows?.length === 1 && r.rows[0].author_ref?.length === 10, 'admin sees 1 report with opaque author_ref');
ok(!Object.values(r.rows?.[0] ?? {}).includes(A), 'queue never contains the author account id');
r = await as(ADM, `select public.admin_moderate('removed', '${postId}', null)`);
ok(!r.error, 'admin removed post ' + (r.error ?? ''));
r = await as(B, `select * from public.community_feed`);
ok(r.rows?.length === 0, 'removed post left the feed');
r = await as(A, `select count(*)::int n from public.notifications where type = 'post_hidden'`);
ok(r.rows?.[0].n === 1, 'author told their post was hidden');
r = await as(ADM, `select count(*)::int n from public.admin_report_queue('open')`);
ok(r.rows?.[0].n === 0, 'report resolved');

r = await as(ADM, `select public.admin_set_author_ban(true, '${postId}', null)`);
ok(!r.error, 'admin paused author ' + (r.error ?? ''));
r = await as(A, `select public.create_community_post('again', 'healing')`);
ok(!!r.error, 'paused author cannot post');
r = await as(A, `select title from public.reflections`);
ok(r.rows?.length === 1, 'paused author still has their private journal');

console.log('\ncomment moderation');
r = await as(B, `select public.create_community_post('A second post', 'love') id`);
const post2 = r.rows?.[0]?.id;
r = await as(ADM, `select public.create_community_comment('${post2}', 'unkind words') id`);
const c2 = r.rows?.[0]?.id;
r = await as(B, `select public.report_content('harassment', null, '${c2}', null)`);
ok(!r.error, 'reply reported');
r = await as(ADM, `select public.admin_moderate('hidden', null, '${c2}')`);
ok(!r.error, 'admin hid reply ' + (r.error ?? ''));
r = await as(B, `select count(*)::int n from public.community_comment_feed where post_id = '${post2}'`);
ok(r.rows?.[0].n === 0, 'hidden reply left the thread');
r = await as(B, `select comments_count from public.community_feed where id = '${post2}'`);
ok(r.rows?.[0]?.comments_count === 0, 'reply count updated after hiding');
r = await as(B, `select public.delete_community_comment('${c2}')`);
ok(!!r.error, "can't delete someone else's reply");

console.log('\nnotification preferences');
r = await as(B, `update public.profiles set notify_comments = false where id = '${B}' returning notify_comments`);
ok(r.rows?.[0]?.notify_comments === false, 'member can turn off reply notifications');
r = await as(B, `select count(*)::int n from public.notifications where type = 'comment'`);
const before = r.rows?.[0].n;
r = await as(ADM, `select public.create_community_comment('${post2}', 'kind words') id`);
ok(!!r.rows?.[0]?.id, 'reply created (' + (r.error ?? 'ok') + ')');
r = await as(B, `select count(*)::int n from public.notifications where type = 'comment'`);
ok(r.rows?.[0].n === before, 'no reply notification when turned off');

console.log('\nrate limit');
for (let i = 0; i < 5; i++) await as(B, `select public.create_community_post('p${i}', 'life')`);
r = await as(B, `select public.create_community_post('p6', 'life')`);
ok(/wait/.test(r.error ?? ''), 'sixth post in an hour is refused');

console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
