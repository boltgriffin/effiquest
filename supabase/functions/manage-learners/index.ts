// Supabase Edge Function (Deno): teacher-issued learner accounts (decision D-20).
// Deploy: `supabase functions deploy manage-learners`. SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are provided by Supabase to the function at runtime; the service-role
// key exists ONLY here, on the server. It is never sent to the browser or written to logs.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { handleAccountRequest, type AccountDeps } from '../_shared/learnerAccounts.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json(401, { error: 'Sign in first.' });

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  // The caller's client: the anon key + the caller's JWT, so RLS decides what it can see.
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: who } = await caller.auth.getUser();
  if (!who.user || who.user.is_anonymous) return json(401, { error: 'Sign in first.' });

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const deps: AccountDeps = {
    async callerClassJoinCode(classId) {
      const { data: owns } = await caller.rpc('owns_active_class', { p_class_id: classId });
      if (owns !== true) return null;
      const { data } = await caller.from('classes').select('join_code').eq('id', classId).single();
      return (data?.join_code as string | undefined) ?? null;
    },
    async callerSeesLearner(classId, learnerId) {
      const { data } = await caller
        .from('enrollments')
        .select('learner_id')
        .eq('class_id', classId)
        .eq('learner_id', learnerId)
        .maybeSingle();
      return Boolean(data);
    },
    async createUser(loginId, password) {
      const { data, error } = await admin.auth.admin.createUser({
        email: loginId,
        password,
        email_confirm: true,
      });
      if (error || !data.user) throw new Error('create failed');
      return data.user.id;
    },
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw new Error('delete failed');
    },
    async setPassword(userId, password) {
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw new Error('update failed');
    },
    async enroll(classId, userId, learnerCode) {
      const { error } = await admin.rpc('enroll_learner_account', {
        p_class_id: classId,
        p_user_id: userId,
        p_learner_code: learnerCode,
      });
      // Messages from our SQL function (SQLSTATE 22023) are safe to show; others are not.
      if (error) throw new Error(error.code === '22023' ? error.message : 'Could not be added.');
    },
    randomBytes: (n) => crypto.getRandomValues(new Uint8Array(n)),
  };

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'Malformed request.' });
  }

  try {
    const result = await handleAccountRequest(deps, body);
    return result.ok ? json(200, result) : json(result.status, { error: result.error });
  } catch {
    // No details (they could include identifiers or keys) leave the function or reach the logs.
    return json(500, { error: 'Something went wrong. Try again.' });
  }
});
