-- TEST ONLY. A minimal stand-in for the parts of Supabase's `auth` schema and roles that the
-- migrations use, so the real migrations and RLS policies can be tested in PGlite (embedded
-- Postgres) without Docker. Never apply this to a Supabase project: Supabase provides these.

create schema auth;

create table auth.users (
  id uuid primary key,
  is_anonymous boolean not null default false
);

-- Supabase's auth.uid(): the `sub` claim of the request JWT.
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
