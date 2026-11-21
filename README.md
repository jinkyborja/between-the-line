# Between the Lines

> Some feelings are difficult to explain. Here, you don't have to. Just write.

A quiet place to read poems and quotes, keep a **strictly private** journal, and share — separately and **anonymously** — with a gentle community.

SvelteKit 3 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Auth) · Vercel

## Run it locally

```bash
npm install
cp .env.example .env    # fill in your Supabase URL + anon key
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run check` | Svelte + TypeScript checks |
| `npm run test:db` | Applies the migrations to in-memory Postgres and runs the privacy/anonymity test suite |
| `npm run build` | Production build (Vercel adapter) |

## Database

Migrations live in [`supabase/migrations`](supabase/migrations); seed content in [`supabase/seed.sql`](supabase/seed.sql).
Apply them in order with the Supabase CLI (`supabase db push`) or the SQL editor, then run the seed.

Make someone an admin (moderator):

```sql
update public.profiles set role = 'admin' where id = '<auth user id>';
```

## Privacy model (enforced in the database, not the UI)

- **Journal (`reflections`) and bookmarks** — owner-only Row Level Security. Admins have no exception.
- **Community** — `community_*` tables are closed to clients. Reads go through views with no author columns; writes go through `SECURITY DEFINER` functions that stamp the author server-side, enforce bans and rate limits.
- **Journal ≠ community** — there is no link between the two. Sharing is a separate, blank composer.
- **Moderation** — admins see an opaque author reference, never an email, name or account id.
- **Service-role key** — server-only (`$app/env/private`), used solely to delete an account.

## Environment variables

| Name | Where | Notes |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | browser + server | Safe to expose; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Optional; enables "Delete account". Never prefix with `PUBLIC_`. |

## Supabase Auth settings

- **URL configuration → Redirect URLs:** `http://localhost:5173/auth/callback` and `https://<your-domain>/auth/callback`
- **Providers → Google** (optional): add your OAuth client ID/secret.
- **Password minimum:** 10 characters, to match the app.

## Deploying to Vercel

Import the GitHub repo in Vercel, add the three environment variables (service key as a sensitive, server-only variable), and deploy. The SvelteKit Vercel adapter is already configured.
