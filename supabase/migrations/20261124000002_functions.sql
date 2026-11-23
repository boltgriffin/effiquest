-- EffiQuest 3D: trusted functions (Milestone 11). Clients cannot write roles, enrollments,
-- attempts or responses directly; these SECURITY DEFINER functions validate every input first.
-- Errors use SQLSTATE 22023 (invalid parameter) or 42501 (not allowed) with a learner-safe message.

grant execute on function public.new_join_code() to authenticated;

-- ---------------------------------------------------------------------------------------------
-- join_class: a signed-in (usually anonymous) user joins a class with the teacher's join code and
-- their pseudonymous learner code. Grants the learner role. Returns the class id and name.
-- ---------------------------------------------------------------------------------------------
create function public.join_class(p_join_code text, p_learner_code text)
returns table (class_id uuid, class_name text)
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  code text := upper(btrim(coalesce(p_learner_code, '')));
  join_code_n text := upper(btrim(coalesce(p_join_code, '')));
  cls public.classes%rowtype;
  existing_code text;
begin
  if uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if code !~ '^[A-Z0-9-]{3,16}$' then
    raise exception 'Learner code: 3 to 16 letters, digits or hyphens.' using errcode = '22023';
  end if;
  if join_code_n !~ '^[A-F0-9]{8}$' then
    raise exception 'Class code: 8 letters and digits, as given by your teacher.' using errcode = '22023';
  end if;
  if exists (select 1 from public.user_roles where profile_id = uid and role = 'teacher') then
    raise exception 'A teacher account cannot join a class as a learner.' using errcode = '42501';
  end if;

  select * into cls from public.classes where join_code = join_code_n and archived_at is null;
  if not found then
    raise exception 'No open class has that code. Check it with your teacher.' using errcode = '22023';
  end if;

  insert into public.profiles (id) values (uid) on conflict (id) do nothing;
  select learner_code into existing_code from public.profiles where id = uid;
  if existing_code is not null and existing_code <> code then
    raise exception 'This device is already signed in as learner %.', existing_code
      using errcode = '22023';
  end if;
  update public.profiles set learner_code = code where id = uid and learner_code is null;

  if exists (
    select 1 from public.enrollments e
    where e.class_id = cls.id and e.learner_code = code and e.learner_id <> uid
  ) then
    raise exception 'That learner code is already used in this class. Ask your teacher.'
      using errcode = '22023';
  end if;

  insert into public.user_roles (profile_id, role) values (uid, 'learner')
    on conflict do nothing;
  insert into public.enrollments (class_id, learner_id, learner_code)
    values (cls.id, uid, code) on conflict do nothing;

  return query select cls.id, cls.name;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- submit_attempt: stores one attempt and all its responses, after checking them against the
-- assessment registry. Idempotent: sending the same attempt id again returns false.
-- ---------------------------------------------------------------------------------------------
create function public.submit_attempt(p_attempt jsonb, p_responses jsonb)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  reg public.assessments%rowtype;
  a_id uuid;
  a_started timestamptz;
  a_submitted timestamptz;
  a_score int;
  a_max int;
  existing_owner uuid;
  r jsonb;
  item public.assessment_items%rowtype;
  n int;
  sum_points int := 0;
  sum_max int := 0;
  pts int;
  mx int;
begin
  if uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.user_roles where profile_id = uid and role = 'learner') then
    raise exception 'Join a class before sending results.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_attempt) <> 'object' or jsonb_typeof(p_responses) <> 'array' then
    raise exception 'Malformed attempt.' using errcode = '22023';
  end if;

  begin
    a_id := (p_attempt ->> 'id')::uuid;
    a_started := (p_attempt ->> 'startedAt')::timestamptz;
    a_submitted := (p_attempt ->> 'submittedAt')::timestamptz;
    a_score := (p_attempt ->> 'score')::int;
    a_max := (p_attempt ->> 'maxScore')::int;
  exception when others then
    raise exception 'Malformed attempt.' using errcode = '22023';
  end;
  if a_id is null or a_started is null or a_submitted is null or a_score is null or a_max is null then
    raise exception 'Malformed attempt.' using errcode = '22023';
  end if;

  -- Idempotency: the same attempt id again is accepted without changes (only for its owner).
  select owner_id into existing_owner from public.attempts where id = a_id;
  if found then
    if existing_owner <> uid then
      raise exception 'Attempt id already used.' using errcode = '42501';
    end if;
    return false;
  end if;

  select * into reg from public.assessments where id = p_attempt ->> 'assessmentId';
  if not found then
    raise exception 'Unknown assessment.' using errcode = '22023';
  end if;
  if reg.version <> p_attempt ->> 'assessmentVersion' then
    raise exception 'These answers are for an older version of the questions.' using errcode = '22023';
  end if;
  if reg.kind <> p_attempt ->> 'kind' or reg.mode <> p_attempt ->> 'mode' then
    raise exception 'Malformed attempt.' using errcode = '22023';
  end if;
  if a_submitted < a_started or a_submitted > now() + interval '5 minutes' then
    raise exception 'Attempt times are not valid.' using errcode = '22023';
  end if;
  if reg.mode = 'test' and exists (
    select 1 from public.attempts where owner_id = uid and assessment_id = reg.id
  ) then
    raise exception 'This diagnostic was already submitted.' using errcode = '22023';
  end if;

  n := jsonb_array_length(p_responses);
  if n <> reg.item_count then
    raise exception 'Every question needs one response.' using errcode = '22023';
  end if;
  if (select count(distinct x ->> 'itemId') from jsonb_array_elements(p_responses) x) <> n then
    raise exception 'Duplicate responses.' using errcode = '22023';
  end if;

  -- Check each response against the registry before writing anything.
  for r in select * from jsonb_array_elements(p_responses) loop
    select * into item from public.assessment_items
      where assessment_id = reg.id and item_id = r ->> 'itemId';
    if not found then
      raise exception 'Unknown question in attempt.' using errcode = '22023';
    end if;
    begin
      pts := (r ->> 'points')::int;
      mx := (r ->> 'maxPoints')::int;
    exception when others then
      raise exception 'Malformed response.' using errcode = '22023';
    end;
    if mx is distinct from item.max_points or pts is null or pts < 0 or pts > mx
      or (r ->> 'misconceptionId') is distinct from item.misconception_id then
      raise exception 'Response does not match the question.' using errcode = '22023';
    end if;
    sum_points := sum_points + pts;
    sum_max := sum_max + mx;
  end loop;

  if sum_max <> reg.max_score or a_max <> reg.max_score or a_score <> sum_points then
    raise exception 'Score does not add up.' using errcode = '22023';
  end if;

  insert into public.attempts (
    id, owner_id, assessment_id, assessment_version, kind, mode, started_at, submitted_at,
    score, max_score
  ) values (
    a_id, uid, reg.id, reg.version, reg.kind, reg.mode, a_started, a_submitted, a_score, a_max
  );

  insert into public.attempt_responses (
    id, attempt_id, owner_id, item_id, response, is_correct, points, max_points, tries,
    misconception_id, revealed, answered_at
  )
  select
    (x ->> 'id')::uuid, a_id, uid, x ->> 'itemId',
    case when x ? 'response' then (x ->> 'response')::jsonb else 'null'::jsonb end,
    (x ->> 'isCorrect')::boolean, (x ->> 'points')::int, (x ->> 'maxPoints')::int,
    (x ->> 'tries')::int, x ->> 'misconceptionId', nullif(x ->> 'revealed', ''),
    (x ->> 'answeredAt')::timestamptz
  from jsonb_array_elements(p_responses) x;

  return true;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- delete_my_cloud_data: a learner removes everything stored about them in the cloud (profile,
-- roles, enrollments, attempts, responses, progress). Data on the device is not touched.
-- ---------------------------------------------------------------------------------------------
create function public.delete_my_cloud_data() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if exists (select 1 from public.user_roles where profile_id = auth.uid() and role = 'teacher') then
    raise exception 'Teacher accounts are removed by the administrator.' using errcode = '42501';
  end if;
  delete from public.profiles where id = auth.uid();
end;
$$;

grant execute on function public.join_class(text, text) to authenticated;
grant execute on function public.submit_attempt(jsonb, jsonb) to authenticated;
grant execute on function public.delete_my_cloud_data() to authenticated;
