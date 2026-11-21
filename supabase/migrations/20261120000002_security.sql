-- =============================================================================
-- Between the Lines — Row Level Security, grants, anonymous views, RPCs
-- =============================================================================
-- Supabase grants ALL on public tables to anon/authenticated by default.
-- We revoke that and grant back only what each table needs, so security does
-- not depend on RLS alone or on anything the frontend chooses to show.
-- =============================================================================

alter table public.profiles           enable row level security;
alter table public.categories         enable row level security;
alter table public.poems              enable row level security;
alter table public.reflections        enable row level security;
alter table public.bookmarks          enable row level security;
alter table public.community_posts    enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes    enable row level security;
alter table public.notifications      enable row level security;
alter table public.reports            enable row level security;

revoke all on public.profiles, public.categories, public.poems, public.reflections,
  public.bookmarks, public.community_posts, public.community_comments,
  public.community_likes, public.notifications, public.reports
  from anon, authenticated;

-- Functions are executable by PUBLIC by default; close that.
revoke execute on function public.set_updated_at()  from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin()        from public;
-- anon needs it because the poems read policy calls it; it returns false without a user.
grant  execute on function public.is_admin()        to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles: you see and edit only your own row. role / ban are not editable.
-- ---------------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (display_name, bio, theme, text_size, notify_comments, notify_appreciation) on public.profiles to authenticated;

create policy "profiles: read own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- categories & poems: readable by everyone (landing page uses the poem of the
-- day); only admins write.
-- ---------------------------------------------------------------------------
grant select on public.categories, public.poems to anon, authenticated;
grant insert, update, delete on public.categories, public.poems to authenticated;

create policy "categories: read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: admin insert" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "categories: admin update" on public.categories
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "categories: admin delete" on public.categories
  for delete to authenticated using ((select public.is_admin()));

create policy "poems: read published" on public.poems
  for select to anon, authenticated
  using (published or (select public.is_admin()));
create policy "poems: admin insert" on public.poems
  for insert to authenticated with check ((select public.is_admin()));
create policy "poems: admin update" on public.poems
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "poems: admin delete" on public.poems
  for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- reflections: strictly the owner. No admin policy on purpose.
-- user_id is never client-writable: it defaults to auth.uid() and is checked.
-- ---------------------------------------------------------------------------
grant select, delete on public.reflections to authenticated;
grant insert (poem_id, title, body, moods, tags, status) on public.reflections to authenticated;
grant update (poem_id, title, body, moods, tags, status) on public.reflections to authenticated;

create policy "reflections: owner select" on public.reflections
  for select to authenticated using (user_id = (select auth.uid()));
create policy "reflections: owner insert" on public.reflections
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "reflections: owner update" on public.reflections
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "reflections: owner delete" on public.reflections
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- bookmarks: owner only
-- ---------------------------------------------------------------------------
grant select, delete on public.bookmarks to authenticated;
grant insert (poem_id) on public.bookmarks to authenticated;

create policy "bookmarks: owner select" on public.bookmarks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "bookmarks: owner insert" on public.bookmarks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "bookmarks: owner delete" on public.bookmarks
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- notifications: recipient only; may mark read or delete. Created by triggers.
-- ---------------------------------------------------------------------------
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "notifications: owner select" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: owner update" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "notifications: owner delete" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- community_* and reports: NO client grants and NO policies.
-- RLS is enabled with nothing permitted, so direct table access returns
-- nothing even if a grant is added by mistake. All access is below.
-- ---------------------------------------------------------------------------

-- =============================================================================
-- Anonymous read views
-- Run with the view owner's rights (security_invoker = false) so they can read
-- the closed tables, and they simply never select author_id / user_id.
-- =============================================================================
create view public.community_feed
with (security_invoker = false, security_barrier = true) as
select
  p.id,
  p.body,
  p.category_id,
  c.slug  as category_slug,
  c.name  as category_name,
  p.poem_id,
  po.slug  as poem_slug,
  po.title as poem_title,
  p.likes_count,
  p.comments_count,
  p.created_at,
  (p.author_id = (select auth.uid())) as is_mine,
  exists (
    select 1 from public.community_likes l
    where l.post_id = p.id and l.user_id = (select auth.uid())
  ) as liked_by_me
from public.community_posts p
join public.categories c on c.id = p.category_id
left join public.poems po on po.id = p.poem_id and po.published
where p.status = 'visible'
  and (select auth.uid()) is not null;

create view public.community_comment_feed
with (security_invoker = false, security_barrier = true) as
select
  cm.id,
  cm.post_id,
  cm.body,
  cm.created_at,
  (cm.author_id = (select auth.uid())) as is_mine
from public.community_comments cm
join public.community_posts p on p.id = cm.post_id
where cm.status = 'visible'
  and p.status = 'visible'
  and (select auth.uid()) is not null;

revoke all on public.community_feed, public.community_comment_feed from anon, authenticated;
grant select on public.community_feed, public.community_comment_feed to authenticated;

-- =============================================================================
-- Community write functions (anonymous; author stamped server-side)
-- =============================================================================
create or replace function public._require_community_member()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if exists (select 1 from public.profiles where id = uid and community_banned_at is not null) then
    raise exception 'Community access is paused for this account' using errcode = '42501';
  end if;
  return uid;
end;
$$;

create or replace function public.create_community_post(
  p_body text,
  p_category_slug text,
  p_poem_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._require_community_member();
  cat smallint;
  new_id uuid;
begin
  if (select count(*) from public.community_posts
      where author_id = uid and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Please wait a little before sharing again' using errcode = '54000';
  end if;

  select id into cat from public.categories where slug = p_category_slug;
  if cat is null then
    raise exception 'Unknown category' using errcode = '22023';
  end if;

  if p_poem_id is not null and not exists (
    select 1 from public.poems where id = p_poem_id and published
  ) then
    p_poem_id := null;
  end if;

  insert into public.community_posts (author_id, category_id, poem_id, body)
  values (uid, cat, p_poem_id, trim(p_body))
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.delete_community_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.community_posts
  where id = p_post_id and author_id = auth.uid();
  if not found then
    raise exception 'Not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.create_community_comment(p_post_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public._require_community_member();
  new_id uuid;
begin
  if (select count(*) from public.community_comments
      where author_id = uid and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'Please wait a little before replying again' using errcode = '54000';
  end if;

  if not exists (select 1 from public.community_posts where id = p_post_id and status = 'visible') then
    raise exception 'Not found' using errcode = 'P0002';
  end if;

  insert into public.community_comments (post_id, author_id, body)
  values (p_post_id, uid, trim(p_body))
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.delete_community_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.community_comments
  where id = p_comment_id and author_id = auth.uid();
  if not found then
    raise exception 'Not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.toggle_community_like(p_post_id uuid)
returns table (liked boolean, likes_count integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if not exists (select 1 from public.community_posts p where p.id = p_post_id and p.status = 'visible') then
    raise exception 'Not found' using errcode = 'P0002';
  end if;

  delete from public.community_likes l where l.post_id = p_post_id and l.user_id = uid;
  if found then
    liked := false;
  else
    insert into public.community_likes (post_id, user_id) values (p_post_id, uid);
    liked := true;
  end if;

  select p.likes_count into likes_count from public.community_posts p where p.id = p_post_id;
  return next;
end;
$$;

create or replace function public.report_content(
  p_reason text,
  p_post_id uuid default null,
  p_comment_id uuid default null,
  p_details text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if num_nonnulls(p_post_id, p_comment_id) <> 1 then
    raise exception 'Report one thing at a time' using errcode = '22023';
  end if;
  if (select count(*) from public.reports
      where reporter_id = uid and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Too many reports today' using errcode = '54000';
  end if;

  insert into public.reports (reporter_id, post_id, comment_id, reason, details)
  values (uid, p_post_id, p_comment_id, p_reason, nullif(trim(p_details), ''))
  on conflict do nothing;  -- reporting the same thing twice is a no-op
end;
$$;

-- =============================================================================
-- Admin moderation functions
-- Admins see an opaque author_ref (stable hash) to spot repeat abuse,
-- never an account id, email or name.
-- =============================================================================
create or replace function public._require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create or replace function public.admin_report_queue(p_status text default 'open')
returns table (
  report_id     uuid,
  reason        text,
  details       text,
  reported_at   timestamptz,
  report_status text,
  target_type   text,
  target_id     uuid,
  target_body   text,
  target_status text,
  target_created_at timestamptz,
  reports_on_target bigint,
  author_ref    text,
  author_prior_removals bigint,
  author_banned boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public._require_admin();

  return query
  with t as (
    select r.*,
      case when r.post_id is not null then 'post' else 'comment' end as ttype,
      coalesce(r.post_id, r.comment_id) as tid,
      coalesce(p.body, c.body)          as tbody,
      coalesce(p.status, c.status)      as tstatus,
      coalesce(p.created_at, c.created_at) as tcreated,
      coalesce(p.author_id, c.author_id) as tauthor
    from public.reports r
    left join public.community_posts    p on p.id = r.post_id
    left join public.community_comments c on c.id = r.comment_id
    where r.status = p_status
  )
  select
    t.id, t.reason, t.details, t.created_at, t.status,
    t.ttype, t.tid, t.tbody, t.tstatus, t.tcreated,
    (select count(*) from public.reports r2
      where r2.post_id is not distinct from t.post_id
        and r2.comment_id is not distinct from t.comment_id),
    left(md5(t.tauthor::text || 'btl-author-ref'), 10),
    (select count(*) from public.community_posts p2 where p2.author_id = t.tauthor and p2.status = 'removed')
      + (select count(*) from public.community_comments c2 where c2.author_id = t.tauthor and c2.status = 'removed'),
    exists (select 1 from public.profiles pr where pr.id = t.tauthor and pr.community_banned_at is not null)
  from t
  order by t.created_at asc
  limit 200;
end;
$$;

-- Set a post or comment to visible / hidden / removed, resolve its open reports,
-- and quietly tell the author (without saying who reported).
create or replace function public.admin_moderate(
  p_status text,
  p_post_id uuid default null,
  p_comment_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_id uuid := public._require_admin();
  author uuid;
begin
  if p_status not in ('visible', 'hidden', 'removed') or num_nonnulls(p_post_id, p_comment_id) <> 1 then
    raise exception 'Invalid moderation request' using errcode = '22023';
  end if;

  if p_post_id is not null then
    update public.community_posts set status = p_status where id = p_post_id returning author_id into author;
  else
    update public.community_comments set status = p_status where id = p_comment_id returning author_id into author;
  end if;

  if author is null then
    raise exception 'Not found' using errcode = 'P0002';
  end if;

  update public.reports
  set status = case when p_status = 'visible' then 'dismissed' else 'actioned' end,
      resolved_by = admin_id, resolved_at = now()
  where status = 'open'
    and post_id is not distinct from p_post_id
    and comment_id is not distinct from p_comment_id;

  if p_status <> 'visible' then
    insert into public.notifications (user_id, type, post_id, comment_id)
    values (author,
            case when p_post_id is not null then 'post_hidden' else 'comment_hidden' end,
            p_post_id, p_comment_id);
  end if;
end;
$$;

create or replace function public.admin_dismiss_report(p_report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_id uuid := public._require_admin();
begin
  update public.reports
  set status = 'dismissed', resolved_by = admin_id, resolved_at = now()
  where id = p_report_id and status = 'open';
end;
$$;

-- Pause (or restore) community access for the author of a post/comment,
-- without revealing who they are.
create or replace function public.admin_set_author_ban(
  p_banned boolean,
  p_post_id uuid default null,
  p_comment_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  author uuid;
begin
  perform public._require_admin();
  select coalesce(
    (select author_id from public.community_posts where id = p_post_id),
    (select author_id from public.community_comments where id = p_comment_id)
  ) into author;
  if author is null then
    raise exception 'Not found' using errcode = 'P0002';
  end if;
  if author = auth.uid() then
    raise exception 'You cannot pause your own account' using errcode = '22023';
  end if;
  update public.profiles
  set community_banned_at = case when p_banned then now() else null end
  where id = author;
end;
$$;

-- Execute permissions: signed-in users only.
revoke execute on function
  public._require_community_member(),
  public._require_admin(),
  public.create_community_post(text, text, uuid),
  public.delete_community_post(uuid),
  public.create_community_comment(uuid, text),
  public.delete_community_comment(uuid),
  public.toggle_community_like(uuid),
  public.report_content(text, uuid, uuid, text),
  public.admin_report_queue(text),
  public.admin_moderate(text, uuid, uuid),
  public.admin_dismiss_report(uuid),
  public.admin_set_author_ban(boolean, uuid, uuid)
  from public, anon;

revoke execute on function public._require_community_member(), public._require_admin() from authenticated;

grant execute on function
  public.create_community_post(text, text, uuid),
  public.delete_community_post(uuid),
  public.create_community_comment(uuid, text),
  public.delete_community_comment(uuid),
  public.toggle_community_like(uuid),
  public.report_content(text, uuid, uuid, text),
  public.admin_report_queue(text),
  public.admin_moderate(text, uuid, uuid),
  public.admin_dismiss_report(uuid),
  public.admin_set_author_ban(boolean, uuid, uuid)
  to authenticated;

-- =============================================================================
-- Counters + notifications (triggers)
-- =============================================================================
create or replace function public.on_like_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author uuid;
begin
  if tg_op = 'INSERT' then
    update public.community_posts set likes_count = likes_count + 1
    where id = new.post_id returning author_id into post_author;

    -- One unread "appreciation" note per post at a time; never says who.
    if post_author is not null and post_author <> new.user_id
       and (select notify_appreciation from public.profiles where id = post_author)
       and not exists (
      select 1 from public.notifications
      where user_id = post_author and post_id = new.post_id
        and type = 'appreciation' and read_at is null
    ) then
      insert into public.notifications (user_id, type, post_id)
      values (post_author, 'appreciation', new.post_id);
    end if;
    return new;
  else
    update public.community_posts set likes_count = greatest(likes_count - 1, 0)
    where id = old.post_id;
    return old;
  end if;
end;
$$;

create trigger community_likes_count
  after insert or delete on public.community_likes
  for each row execute function public.on_like_change();

create or replace function public.on_comment_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid := coalesce(new.post_id, old.post_id);
  post_author uuid;
begin
  update public.community_posts
  set comments_count = (
    select count(*) from public.community_comments
    where post_id = pid and status = 'visible'
  )
  where id = pid
  returning author_id into post_author;

  if tg_op = 'INSERT' and post_author is not null and post_author <> new.author_id
     and (select notify_comments from public.profiles where id = post_author) then
    insert into public.notifications (user_id, type, post_id, comment_id)
    values (post_author, 'comment', new.post_id, new.id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger community_comments_count
  after insert or delete or update of status on public.community_comments
  for each row execute function public.on_comment_change();

revoke execute on function public.on_like_change(), public.on_comment_change() from public, anon, authenticated;
