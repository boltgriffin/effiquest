/**
 * Types for the Supabase schema in supabase/migrations (Milestone 11), in the shape that
 * `supabase gen types typescript` produces. Regenerate with that command after a schema change
 * when the Supabase CLI is available; the RLS tests keep the SQL itself honest.
 */
type Timestamp = string;

type Table<Row, Insert> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  learner_code: string | null;
  created_at: Timestamp;
};
export type UserRoleRow = {
  profile_id: string;
  role: 'learner' | 'teacher';
  granted_at: Timestamp;
};
export type ClassRow = {
  id: string;
  teacher_id: string;
  name: string;
  school_year: string | null;
  join_code: string;
  archived_at: Timestamp | null;
  created_at: Timestamp;
};
export type EnrollmentRow = {
  class_id: string;
  learner_id: string;
  learner_code: string;
  joined_at: Timestamp;
};
export type AttemptRow = {
  id: string;
  owner_id: string;
  assessment_id: string;
  assessment_version: string;
  kind: 'baseline' | 'post' | 'quest_check';
  mode: 'test' | 'practice';
  started_at: Timestamp;
  submitted_at: Timestamp;
  score: number;
  max_score: number;
  received_at: Timestamp;
};
export type AttemptResponseRow = {
  id: string;
  attempt_id: string;
  owner_id: string;
  item_id: string;
  response: unknown;
  is_correct: boolean;
  points: number;
  max_points: number;
  tries: number;
  misconception_id: string;
  revealed: string | null;
  answered_at: Timestamp;
};
export type ProgressEventRow = {
  id: string;
  owner_id: string;
  kind:
    | 'lesson_opened'
    | 'lesson_completed'
    | 'activity_completed'
    | 'quest_stage'
    | 'assessment_submitted';
  ref_id: string;
  created_at: Timestamp;
  received_at: Timestamp;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Omit<ProfileRow, 'created_at'>>;
      user_roles: Table<UserRoleRow, Omit<UserRoleRow, 'granted_at'>>;
      classes: Table<
        ClassRow,
        { name: string; school_year?: string | null; archived_at?: Timestamp | null }
      >;
      enrollments: Table<EnrollmentRow, Omit<EnrollmentRow, 'joined_at'>>;
      attempts: Table<AttemptRow, Record<string, never>>;
      attempt_responses: Table<AttemptResponseRow, Record<string, never>>;
      progress_events: Table<
        ProgressEventRow,
        { id: string; kind: ProgressEventRow['kind']; ref_id: string; created_at: Timestamp }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      join_class: {
        Args: { p_join_code: string; p_learner_code: string };
        Returns: Array<{ class_id: string; class_name: string }>;
      };
      submit_attempt: {
        Args: { p_attempt: Record<string, unknown>; p_responses: Array<Record<string, unknown>> };
        Returns: boolean;
      };
      delete_my_cloud_data: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { app_role: 'learner' | 'teacher' };
    CompositeTypes: { [_ in never]: never };
  };
};
