-- =============================================================================
-- Between the Lines — "A Letter to Myself"
-- =============================================================================
-- Letters are strictly private: owner-only RLS, no admin exception, no link to
-- community tables, not readable by anon, never exposed through any view.
-- =============================================================================

create table public.letters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind         text not null check (kind in ('past', 'present', 'future', 'unsent')),
  recipient    text check (char_length(recipient) <= 80),        -- "Dear ___" for letters never sent
  title        text check (char_length(title) <= 160),
  body         text not null default '' check (char_length(body) <= 50000),
  status       text not null default 'draft' check (status in ('draft', 'complete')),
  archived_at  timestamptz,
  remind_on    date,                                              -- future letters: when to reopen
  reminded_at  timestamptz,
  search       tsvector generated always as (
                 setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                 setweight(to_tsvector('english', coalesce(recipient, '')), 'B') ||
                 setweight(to_tsvector('english', coalesce(body, '')), 'C')
               ) stored,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint letters_reminder_only_future check (remind_on is null or kind = 'future')
);

create index letters_user_updated_idx on public.letters (user_id, updated_at desc);
create index letters_user_kind_idx    on public.letters (user_id, kind);
create index letters_search_idx       on public.letters using gin (search);
create index letters_due_idx          on public.letters (user_id, remind_on)
  where remind_on is not null and reminded_at is null;

create trigger letters_updated_at
  before update on public.letters
  for each row execute function public.set_updated_at();

-- A new reminder date re-arms the reminder.
create or replace function public.letters_rearm_reminder()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.remind_on is distinct from old.remind_on then
    new.reminded_at = null;
  end if;
  return new;
end;
$$;

create trigger letters_rearm
  before update of remind_on on public.letters
  for each row execute function public.letters_rearm_reminder();

revoke execute on function public.letters_rearm_reminder() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS: the owner, and only the owner. No anon access at all.
-- ---------------------------------------------------------------------------
alter table public.letters enable row level security;
revoke all on public.letters from anon, authenticated;

grant select, delete on public.letters to authenticated;
grant insert (kind, recipient, title, body, status, archived_at, remind_on) on public.letters to authenticated;
grant update (kind, recipient, title, body, status, archived_at, remind_on) on public.letters to authenticated;

create policy "letters: owner select" on public.letters
  for select to authenticated using (user_id = (select auth.uid()));
create policy "letters: owner insert" on public.letters
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "letters: owner update" on public.letters
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "letters: owner delete" on public.letters
  for delete to authenticated using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Reminders → private notifications (no letter content is copied).
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column letter_id uuid references public.letters (id) on delete cascade;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('comment', 'appreciation', 'post_hidden', 'comment_hidden', 'report_resolved', 'letter_reminder'));

create index notifications_letter_idx on public.notifications (letter_id);

-- Called by the app on page load. Touches only the caller's own letters.
create or replace function public.claim_letter_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  n integer;
begin
  if uid is null then
    return 0;
  end if;

  with due as (
    update public.letters
    set reminded_at = now()
    where user_id = uid
      and remind_on is not null
      and remind_on <= current_date
      and reminded_at is null
      and archived_at is null
    returning id
  )
  insert into public.notifications (user_id, type, letter_id)
  select uid, 'letter_reminder', id from due;

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.claim_letter_reminders() from public, anon;
grant execute on function public.claim_letter_reminders() to authenticated;
