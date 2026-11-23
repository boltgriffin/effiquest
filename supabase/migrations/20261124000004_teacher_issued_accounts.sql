-- EffiQuest 3D: teacher-issued learner accounts (decision D-20, option C).
-- Learners no longer create anonymous accounts or join classes themselves. The teacher adds
-- learner codes to a class; the `manage-learners` Edge Function (service role, server only)
-- creates one account per code with a random PIN and calls enroll_learner_account().
-- No email, no name: the sign-in identifier is derived from the class code and learner code.

-- Self-joining is replaced by teacher-issued accounts.
drop function public.join_class(text, text);

-- Called ONLY by the Edge Function with the service role, after it has checked that the caller
-- is the teacher of the class. Not executable by signed-in users.
create function public.enroll_learner_account(
  p_class_id uuid,
  p_user_id uuid,
  p_learner_code text
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  code text := upper(btrim(coalesce(p_learner_code, '')));
begin
  if code !~ '^[A-Z0-9-]{3,16}$' then
    raise exception 'Learner code: 3 to 16 letters, digits or hyphens.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.classes where id = p_class_id and archived_at is null) then
    raise exception 'The class is archived or does not exist.' using errcode = '22023';
  end if;
  if exists (select 1 from public.enrollments where class_id = p_class_id and learner_code = code) then
    raise exception 'Learner code % is already in this class.', code using errcode = '22023';
  end if;
  insert into public.profiles (id, learner_code) values (p_user_id, code)
    on conflict (id) do update set learner_code = excluded.learner_code;
  insert into public.user_roles (profile_id, role) values (p_user_id, 'learner')
    on conflict do nothing;
  insert into public.enrollments (class_id, learner_id, learner_code)
    values (p_class_id, p_user_id, code);
end;
$$;

revoke all on function public.enroll_learner_account(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.enroll_learner_account(uuid, uuid, text) to service_role;

-- The Edge Function checks the CALLER (with the caller's own JWT, under RLS) with this:
-- true only for a teacher who owns this active class.
create function public.owns_active_class(p_class_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.has_role('teacher') and exists (
    select 1 from public.classes
    where id = p_class_id and teacher_id = auth.uid() and archived_at is null
  );
$$;
grant execute on function public.owns_active_class(uuid) to authenticated;
