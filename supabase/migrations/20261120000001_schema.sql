-- =============================================================================
-- Between the Lines — schema
-- =============================================================================
-- Privacy model
--   * reflections (journal) and bookmarks: owner-only via RLS. Admins get NO
--     exception — moderators cannot read anyone's journal.
--   * community_*: the base tables are closed to client roles entirely.
--     Reads go through views that never select author_id / user_id.
--     Writes go through SECURITY DEFINER functions (see 0002) that stamp
--     auth.uid() server-side, enforce bans and rate limits.
--   * The author <-> post link is kept for moderation and abuse prevention only.
--   * There is no foreign key between reflections and community_posts:
--     a journal entry can never become a post automatically.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — private account data, 1:1 with auth.users. Never public.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default 'Reader'
                check (char_length(display_name) between 1 and 60),
  bio           text check (char_length(bio) <= 280),
  role          text not null default 'member' check (role in ('member', 'admin')),
  theme         text not null default 'light' check (theme in ('light', 'dark', 'system')),
  text_size     text not null default 'M' check (text_size in ('S', 'M', 'L')),
  notify_comments     boolean not null default true,
  notify_appreciation boolean not null default true,
  community_banned_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role check used by policies and admin functions.
-- SECURITY DEFINER so it can read profiles without recursing through RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Create a profile row for every new account.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 60), ''),
      nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 60), ''),
      'Reader'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- categories — emotional categories shared by poems and community posts
-- ---------------------------------------------------------------------------
create table public.categories (
  id          smallint generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9-]{1,40}$'),
  name        text not null unique check (char_length(name) between 1 and 40),
  description text,
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);

create index categories_sort_idx on public.categories (sort_order);

-- ---------------------------------------------------------------------------
-- poems — curated poems and quotes (written by admins)
-- ---------------------------------------------------------------------------
create table public.poems (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]{1,80}$'),
  kind            text not null default 'poem' check (kind in ('poem', 'quote')),
  title           text not null check (char_length(title) between 1 and 160),
  body            text not null check (char_length(body) between 1 and 20000),
  author          text not null check (char_length(author) between 1 and 120),
  category_id     smallint not null references public.categories (id) on delete restrict,
  reflection_prompts text[] not null default '{}',
  reading_minutes smallint not null default 1 check (reading_minutes > 0),
  is_featured     boolean not null default false,
  featured_on     date unique,               -- "poem of the day"
  published       boolean not null default true,
  search          tsvector generated always as (
                    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(author, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(body, '')), 'C')
                  ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index poems_category_idx on public.poems (category_id);
create index poems_created_idx  on public.poems (created_at desc);
create index poems_featured_idx on public.poems (is_featured) where is_featured;
create index poems_search_idx   on public.poems using gin (search);

create trigger poems_updated_at
  before update on public.poems
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- reflections — the private journal. Owner-only, always.
-- ---------------------------------------------------------------------------
create table public.reflections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  poem_id     uuid references public.poems (id) on delete set null,
  title       text check (char_length(title) <= 160),
  body        text not null default '' check (char_length(body) <= 50000),
  moods       text[] not null default '{}'
              check (moods <@ array['tender', 'aching', 'hopeful', 'restless', 'grateful', 'numb', 'lighter', 'unsure']::text[]
                     and cardinality(moods) <= 4),
  tags        text[] not null default '{}'
              check (cardinality(tags) <= 12 and char_length(array_to_string(tags, '')) <= 12 * 32),
  status      text not null default 'draft' check (status in ('draft', 'saved')),
  search      tsvector generated always as (
                setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                setweight(to_tsvector('english', coalesce(body, '')), 'B')
              ) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index reflections_user_created_idx on public.reflections (user_id, created_at desc);
create index reflections_user_status_idx  on public.reflections (user_id, status);
create index reflections_poem_idx         on public.reflections (poem_id);
create index reflections_tags_idx         on public.reflections using gin (tags);
create index reflections_moods_idx       on public.reflections using gin (moods);
create index reflections_search_idx       on public.reflections using gin (search);

create trigger reflections_updated_at
  before update on public.reflections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bookmarks — owner-only
-- ---------------------------------------------------------------------------
create table public.bookmarks (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  poem_id    uuid not null references public.poems (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, poem_id)
);

create index bookmarks_user_created_idx on public.bookmarks (user_id, created_at desc);
create index bookmarks_poem_idx on public.bookmarks (poem_id);

-- ---------------------------------------------------------------------------
-- community_posts — anonymous. author_id is protected moderation data.
-- ---------------------------------------------------------------------------
create table public.community_posts (
  id             uuid primary key default gen_random_uuid(),
  author_id      uuid not null references public.profiles (id) on delete cascade,
  category_id    smallint not null references public.categories (id) on delete restrict,
  poem_id        uuid references public.poems (id) on delete set null,
  body           text not null check (char_length(trim(body)) between 1 and 4000),
  status         text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  likes_count    integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index community_posts_feed_idx     on public.community_posts (status, created_at desc);
create index community_posts_category_idx on public.community_posts (category_id, created_at desc);
create index community_posts_author_idx   on public.community_posts (author_id, created_at desc);
create index community_posts_poem_idx     on public.community_posts (poem_id);

create trigger community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- community_comments — anonymous
-- ---------------------------------------------------------------------------
create table public.community_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.community_posts (id) on delete cascade,
  author_id   uuid not null references public.profiles (id) on delete cascade,
  body        text not null check (char_length(trim(body)) between 1 and 1500),
  status      text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index community_comments_post_idx   on public.community_comments (post_id, created_at);
create index community_comments_author_idx on public.community_comments (author_id, created_at desc);

create trigger community_comments_updated_at
  before update on public.community_comments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- community_likes — "I felt this". One per person per post.
-- ---------------------------------------------------------------------------
create table public.community_likes (
  post_id    uuid not null references public.community_posts (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index community_likes_user_idx on public.community_likes (user_id);

-- ---------------------------------------------------------------------------
-- notifications — private to the recipient. Never names the actor.
-- ---------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  type        text not null check (type in ('comment', 'appreciation', 'post_hidden', 'comment_hidden', 'report_resolved')),
  post_id     uuid references public.community_posts (id) on delete cascade,
  comment_id  uuid references public.community_comments (id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_user_idx   on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- reports — one target (post XOR comment); one report per person per target
-- ---------------------------------------------------------------------------
create table public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.profiles (id) on delete cascade,
  post_id      uuid references public.community_posts (id) on delete cascade,
  comment_id   uuid references public.community_comments (id) on delete cascade,
  reason       text not null check (reason in ('harassment', 'hate', 'self_harm', 'identifying_info', 'spam', 'other')),
  details      text check (char_length(details) <= 1000),
  status       text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  resolved_by  uuid references public.profiles (id) on delete set null,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  constraint reports_one_target check (num_nonnulls(post_id, comment_id) = 1)
);

create unique index reports_unique_post    on public.reports (reporter_id, post_id)    where post_id is not null;
create unique index reports_unique_comment on public.reports (reporter_id, comment_id) where comment_id is not null;
create index reports_open_idx on public.reports (status, created_at) where status = 'open';
create index reports_post_idx on public.reports (post_id);
create index reports_comment_idx on public.reports (comment_id);
