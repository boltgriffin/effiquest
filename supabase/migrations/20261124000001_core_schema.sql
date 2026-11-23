-- EffiQuest 3D: core schema, roles and Row Level Security (Milestone 11).
-- See docs/BACKEND_AND_SECURITY.md. Data minimisation (D-09): no names, no emails in public tables.
-- Learners are anonymous Supabase users identified only by a pseudonymous learner code.

-- ---------------------------------------------------------------------------------------------
-- Types and helpers
-- ---------------------------------------------------------------------------------------------

create type public.app_role as enum ('learner', 'teacher');

-- 8-character class join code (hex, upper case). 32 bits; join attempts are rate-limited by the
-- Supabase API and codes can be rotated by archiving a class.
create function public.new_join_code() returns text
language sql volatile set search_path = '' as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

-- ---------------------------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  learner_code text check (learner_code ~ '^[A-Z0-9-]{3,16}$'),
  created_at timestamptz not null default now()
);
comment on table public.profiles is 'One row per auth user. Learners: pseudonymous learner code only.';

-- Roles are data, granted only by trusted code (join_class for learners, an administrator for
-- teachers). Clients can read their own roles but never write them.
create table public.user_roles (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  primary key (profile_id, role)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  school_year text check (school_year ~ '^[0-9]{4}-[0-9]{4}$'),
  join_code text not null unique default public.new_join_code(),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.enrollments (
  class_id uuid not null references public.classes (id) on delete cascade,
  learner_id uuid not null references public.profiles (id) on delete cascade,
  learner_code text not null check (learner_code ~ '^[A-Z0-9-]{3,16}$'),
  joined_at timestamptz not null default now(),
  primary key (class_id, learner_id),
  unique (class_id, learner_code)
);
create index enrollments_learner_idx on public.enrollments (learner_id);

-- ---------------------------------------------------------------------------------------------
-- Assessment registry (server-side validation of submitted attempts). Item text and answer keys
-- stay in the app's content pack (DATABASE_PLAN.md section 1); the server only knows the shape.
-- ---------------------------------------------------------------------------------------------

create table public.assessments (
  id text primary key check (id ~ '^[a-z0-9-]{3,60}$'),
  kind text not null check (kind in ('baseline', 'post', 'quest_check')),
  mode text not null check (mode in ('test', 'practice')),
  version text not null,
  item_count int not null check (item_count > 0),
  max_score int not null check (max_score >= 0)
);

create table public.assessment_items (
  assessment_id text not null references public.assessments (id) on delete cascade,
  item_id text not null,
  max_points int not null check (max_points >= 0),
  misconception_id text not null check (misconception_id ~ '^G[1-6]$'),
  primary key (assessment_id, item_id)
);

-- ---------------------------------------------------------------------------------------------
-- Learner records (append-only; ids generated on the device so sync is idempotent)
-- ---------------------------------------------------------------------------------------------

create table public.attempts (
  id uuid primary key,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  assessment_id text not null references public.assessments (id),
  assessment_version text not null,
  kind text not null check (kind in ('baseline', 'post', 'quest_check')),
  mode text not null check (mode in ('test', 'practice')),
  started_at timestamptz not null,
  submitted_at timestamptz not null,
  score int not null check (score >= 0),
  max_score int not null check (max_score >= 0),
  received_at timestamptz not null default now(),
  check (score <= max_score),
  check (started_at <= submitted_at)
);
create index attempts_owner_idx on public.attempts (owner_id);
-- A diagnostic (test mode) counts once per learner.
create unique index attempts_one_test_per_learner on public.attempts (owner_id, assessment_id)
  where mode = 'test';

create table public.attempt_responses (
  id uuid primary key,
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  item_id text not null,
  response jsonb not null check (octet_length(response::text) <= 2000),
  is_correct boolean not null,
  points int not null check (points >= 0),
  max_points int not null check (max_points >= 0),
  tries int not null check (tries between 0 and 10),
  misconception_id text not null check (misconception_id ~ '^G[1-6]$'),
  revealed text check (revealed ~ '^G[1-6]$'),
  answered_at timestamptz not null,
  check (points <= max_points),
  unique (attempt_id, item_id)
);
create index attempt_responses_owner_idx on public.attempt_responses (owner_id);

create table public.progress_events (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (
    kind in ('lesson_opened', 'lesson_completed', 'activity_completed', 'quest_stage', 'assessment_submitted')
  ),
  ref_id text not null check (ref_id ~ '^[a-z0-9_:-]{1,80}$'),
  created_at timestamptz not null check (created_at <= now() + interval '5 minutes'),
  received_at timestamptz not null default now()
);
create index progress_events_owner_idx on public.progress_events (owner_id);

-- ---------------------------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER so policies do not recurse through RLS)
-- ---------------------------------------------------------------------------------------------

create function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.user_roles where profile_id = auth.uid() and role = r
  );
$$;

-- True when the signed-in user is a teacher who owns an active class the learner is enrolled in.
create function public.teaches(learner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.learner_id = learner
      and c.teacher_id = auth.uid()
      and c.archived_at is null
  ) and public.has_role('teacher');
$$;

create function public.is_enrolled_in(class uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.enrollments where class_id = class and learner_id = auth.uid()
  );
$$;

-- Every new auth user gets an empty profile (no roles). Runs inside the auth insert.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_items enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_responses enable row level security;
alter table public.progress_events enable row level security;

-- Start from nothing, then grant exactly what each role needs (defence in depth with RLS).
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- profiles: own row, or learners in the teacher's classes. No client writes.
grant select on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.teaches(id));

-- user_roles: read own roles only.
grant select on public.user_roles to authenticated;
create policy user_roles_select_own on public.user_roles for select to authenticated
  using (profile_id = auth.uid());

-- classes: teachers manage their own; learners read the class they joined.
grant select, insert on public.classes to authenticated;
grant update (name, school_year, archived_at) on public.classes to authenticated;
create policy classes_select on public.classes for select to authenticated
  using (teacher_id = auth.uid() or public.is_enrolled_in(id));
create policy classes_insert on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and public.has_role('teacher'));
create policy classes_update on public.classes for update to authenticated
  using (teacher_id = auth.uid() and public.has_role('teacher'))
  with check (teacher_id = auth.uid());

-- enrollments: created only by join_class(); the learner and the class teacher can read;
-- the teacher can remove a learner from their class.
grant select, delete on public.enrollments to authenticated;
create policy enrollments_select on public.enrollments for select to authenticated
  using (
    learner_id = auth.uid()
    or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );
create policy enrollments_delete on public.enrollments for delete to authenticated
  using (
    exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

-- registry: readable by signed-in users (it holds no answers).
grant select on public.assessments, public.assessment_items to authenticated;
create policy assessments_read on public.assessments for select to authenticated using (true);
create policy assessment_items_read on public.assessment_items for select to authenticated
  using (true);

-- attempts and responses: written only by submit_attempt(); read by the owner or their teacher.
grant select on public.attempts, public.attempt_responses to authenticated;
create policy attempts_select on public.attempts for select to authenticated
  using (owner_id = auth.uid() or public.teaches(owner_id));
create policy attempt_responses_select on public.attempt_responses for select to authenticated
  using (owner_id = auth.uid() or public.teaches(owner_id));

-- progress events: learners append their own; read by the owner or their teacher. No updates.
grant select, insert on public.progress_events to authenticated;
create policy progress_select on public.progress_events for select to authenticated
  using (owner_id = auth.uid() or public.teaches(owner_id));
create policy progress_insert on public.progress_events for insert to authenticated
  with check (owner_id = auth.uid() and public.has_role('learner'));

grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.teaches(uuid) to authenticated;
grant execute on function public.is_enrolled_in(uuid) to authenticated;
