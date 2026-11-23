import { useCallback, useEffect, useRef, useState } from 'react';
import { loadDraft, saveDraft, submitAttempt } from '@/services/storage/attempts';
import type { Assessment, AssessmentDraft, Attempt, AttemptResponse, ItemResponse } from '@/types';
import { checkItem, PRACTICE_MAX_TRIES, scoreAttempt, type AttemptScore } from './scoring';

const SAVE_DELAY_MS = 300;

function freshDraft(assessment: Assessment, ownerId: string): AssessmentDraft {
  const now = new Date().toISOString();
  return {
    key: `${ownerId}:${assessment.id}`,
    ownerId,
    assessmentId: assessment.id,
    assessmentVersion: assessment.version,
    startedAt: now,
    updatedAt: now,
    index: 0,
    responses: {},
    tries: {},
    checked: {},
  };
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'working'; draft: AssessmentDraft; resumed: boolean }
  | { status: 'submitting'; draft: AssessmentDraft }
  | { status: 'submitted'; draft: AssessmentDraft; result: AttemptScore; attempt: Attempt };

/** Practice feedback for one item: shown while the checked answer is still the current answer. */
export interface PracticeFeedback {
  correct: boolean;
  tries: number;
  /** No more checks: the answer and explanation are shown. */
  settled: boolean;
}

/**
 * State of one assessment attempt. Answers are saved to IndexedDB as a draft shortly after each
 * change (and when the page is hidden), so refreshing or closing the tab loses nothing.
 */
export function useAssessmentSession(assessment: Assessment, ownerId: string) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [saveError, setSaveError] = useState(false);
  const pending = useRef<AssessmentDraft | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const d = pending.current;
    pending.current = null;
    if (!d) return;
    saveDraft(d).then(
      () => setSaveError(false),
      () => setSaveError(true),
    );
  }, []);

  // Load (or start) the draft.
  useEffect(() => {
    let cancelled = false;
    loadDraft(ownerId, assessment.id).then(
      (d) => {
        if (cancelled) return;
        // A draft for an older version of the items is discarded: its answers may not fit.
        const usable = d && d.assessmentVersion === assessment.version ? d : undefined;
        setState({
          status: 'working',
          draft: usable ?? freshDraft(assessment, ownerId),
          resumed: Boolean(usable),
        });
      },
      () => {
        if (cancelled) return;
        setSaveError(true);
        setState({ status: 'working', draft: freshDraft(assessment, ownerId), resumed: false });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [assessment, ownerId]);

  // Save immediately when the page is hidden or the screen unmounts.
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush]);

  const update = useCallback(
    (change: (d: AssessmentDraft) => AssessmentDraft) => {
      setState((s) => {
        if (s.status !== 'working') return s;
        const draft = { ...change(s.draft), updatedAt: new Date().toISOString() };
        pending.current = draft;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, SAVE_DELAY_MS);
        return { ...s, draft };
      });
    },
    [flush],
  );

  const setResponse = useCallback(
    (itemId: string, response: ItemResponse) =>
      update((d) => ({ ...d, responses: { ...d.responses, [itemId]: response } })),
    [update],
  );

  const goTo = useCallback(
    (index: number) =>
      update((d) => ({ ...d, index: Math.max(0, Math.min(assessment.items.length, index)) })),
    [update, assessment.items.length],
  );

  /** Practice: check the current answer for one item (an unreadable number does not use a try). */
  const check = useCallback(
    (itemId: string) =>
      update((d) => {
        const item = assessment.items.find((i) => i.id === itemId);
        if (!item) return d;
        const result = checkItem(item, d.responses[itemId]);
        if (!result.answered || result.inputError) return d;
        return {
          ...d,
          tries: { ...d.tries, [itemId]: (d.tries[itemId] ?? 0) + 1 },
          checked: { ...d.checked, [itemId]: JSON.stringify(d.responses[itemId]) },
        };
      }),
    [update, assessment.items],
  );

  const feedbackFor = useCallback(
    (draft: AssessmentDraft, itemId: string): PracticeFeedback | null => {
      const item = assessment.items.find((i) => i.id === itemId);
      const checkedJson = draft.checked[itemId];
      const tries = draft.tries[itemId] ?? 0;
      if (!item || checkedJson === undefined || tries === 0) return null;
      const correct = checkItem(item, JSON.parse(checkedJson) as ItemResponse).correct;
      const settled = correct || tries >= PRACTICE_MAX_TRIES;
      // A changed answer hides the "not quite" message until it is checked again.
      if (!settled && JSON.stringify(draft.responses[itemId]) !== checkedJson) return null;
      return { correct, tries, settled };
    },
    [assessment.items],
  );

  const submit = useCallback(async () => {
    if (state.status !== 'working') return;
    if (timer.current) clearTimeout(timer.current);
    pending.current = null;
    const draft = state.draft;
    setState({ status: 'submitting', draft });
    const result = scoreAttempt(assessment, draft.responses, draft.tries);
    const submittedAt = new Date().toISOString();
    const attempt: Attempt = {
      id: crypto.randomUUID(),
      ownerId,
      assessmentId: assessment.id,
      assessmentVersion: assessment.version,
      kind: assessment.kind,
      mode: assessment.mode,
      startedAt: draft.startedAt,
      submittedAt,
      score: result.score,
      maxScore: result.maxScore,
    };
    const responses: AttemptResponse[] = result.items.map((r) => ({
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      itemId: r.item.id,
      response: JSON.stringify(r.response ?? null),
      isCorrect: r.check.correct,
      points: r.points,
      maxPoints: r.check.maxPoints,
      tries: r.tries,
      misconceptionId: r.item.misconceptionId,
      ...(r.check.revealed ? { revealed: r.check.revealed } : {}),
      answeredAt: submittedAt,
    }));
    try {
      await submitAttempt(attempt, responses);
      setSaveError(false);
      setState({ status: 'submitted', draft, result, attempt });
    } catch {
      setSaveError(true);
      setState({ status: 'working', draft, resumed: false });
    }
  }, [state, assessment, ownerId]);

  return { state, saveError, setResponse, goTo, check, feedbackFor, submit };
}
