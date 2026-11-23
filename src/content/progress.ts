import { findAssessment, questChecks } from '@/content/assessments';
import { modules } from '@/content/modules';
import { labs, quests, type Quest, type QuestStage } from '@/content/quests';
import type { ProgressEvent } from '@/types';

/** Pure functions turning the append-only event log into "what is done" and "what is next". */

export function isModuleComplete(events: readonly ProgressEvent[], moduleId: string): boolean {
  return events.some((e) => e.kind === 'lesson_completed' && e.refId === moduleId);
}

export function isLabComplete(events: readonly ProgressEvent[], labId: string): boolean {
  return events.some((e) => e.kind === 'activity_completed' && e.refId === labId);
}

export function isAssessmentSubmitted(
  events: readonly ProgressEvent[],
  assessmentId: string,
): boolean {
  return events.some((e) => e.kind === 'assessment_submitted' && e.refId === assessmentId);
}

export function isLessonOpened(events: readonly ProgressEvent[], moduleId: string): boolean {
  return events.some(
    (e) => (e.kind === 'lesson_opened' || e.kind === 'lesson_completed') && e.refId === moduleId,
  );
}

export function questStageRef(questId: string, stageId: string): string {
  return `${questId}:${stageId}`;
}

export function isStageComplete(
  events: readonly ProgressEvent[],
  quest: Quest,
  stage: QuestStage,
): boolean {
  switch (stage.kind) {
    case 'lesson':
      return isModuleComplete(events, stage.moduleId);
    case 'lab':
      return isLabComplete(events, stage.labId);
    case 'check':
      return isAssessmentSubmitted(events, stage.assessmentId);
    case 'reflect':
      return events.some(
        (e) => e.kind === 'quest_stage' && e.refId === questStageRef(quest.id, stage.id),
      );
  }
}

export interface QuestProgress {
  quest: Quest;
  done: number;
  total: number;
  complete: boolean;
  nextStage: QuestStage | undefined;
}

export function questProgress(events: readonly ProgressEvent[], quest: Quest): QuestProgress {
  const status = quest.stages.map((s) => isStageComplete(events, quest, s));
  const done = status.filter(Boolean).length;
  return {
    quest,
    done,
    total: quest.stages.length,
    complete: done === quest.stages.length,
    nextStage: quest.stages.find((_, i) => !status[i]),
  };
}

export function stageHref(quest: Quest, stage: QuestStage): string {
  switch (stage.kind) {
    case 'lesson':
      return `/learn/${stage.moduleId}`;
    case 'lab':
      return labs.find((l) => l.id === stage.labId)?.to ?? '/lab';
    case 'check':
      return `/quests/${quest.id}/check`;
    case 'reflect':
      return `/quests/${quest.id}#reflect`;
  }
}

/** The quest the learner most recently worked on that is not finished, else the first unfinished. */
export function currentQuest(events: readonly ProgressEvent[]): QuestProgress | undefined {
  const all = quests.map((q) => questProgress(events, q));
  const open = all.filter((p) => !p.complete);
  if (open.length === 0) return undefined;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (!e) continue;
    const touched = open.find((p) =>
      p.quest.stages.some(
        (s) =>
          (s.kind === 'lesson' &&
            (e.kind === 'lesson_completed' || e.kind === 'lesson_opened') &&
            e.refId === s.moduleId) ||
          (s.kind === 'lab' && e.kind === 'activity_completed' && e.refId === s.labId) ||
          (s.kind === 'check' && e.kind === 'assessment_submitted' && e.refId === s.assessmentId) ||
          (e.kind === 'quest_stage' && e.refId.startsWith(`${p.quest.id}:`)),
      ),
    );
    if (touched) return touched;
  }
  return open[0];
}

export interface ProgressSummary {
  lessonsOpened: number;
  modulesDone: number;
  modulesTotal: number;
  labsDone: number;
  labsTotal: number;
  questsDone: number;
  questsTotal: number;
  checksDone: number;
  checksTotal: number;
  /** Submissions of any assessment (repeats of practice checks included). */
  assessmentAttempts: number;
}

export function summarize(events: readonly ProgressEvent[]): ProgressSummary {
  return {
    lessonsOpened: modules.filter((m) => isLessonOpened(events, m.id)).length,
    modulesDone: modules.filter((m) => isModuleComplete(events, m.id)).length,
    modulesTotal: modules.length,
    labsDone: labs.filter((l) => isLabComplete(events, l.id)).length,
    labsTotal: labs.length,
    questsDone: quests.filter((q) => questProgress(events, q).complete).length,
    questsTotal: quests.length,
    checksDone: questChecks.filter((c) => isAssessmentSubmitted(events, c.id)).length,
    checksTotal: questChecks.length,
    assessmentAttempts: events.filter((e) => e.kind === 'assessment_submitted').length,
  };
}

export interface ActivityItem {
  id: string;
  text: string;
  to: string;
  at: string;
}

/** Newest-first readable activity list (opening a lesson is not listed: it is not an outcome). */
export function recentActivity(events: readonly ProgressEvent[], limit = 5): ActivityItem[] {
  return [...events]
    .filter((e) => e.kind !== 'lesson_opened')
    .reverse()
    .slice(0, limit)
    .map((e) => {
      if (e.kind === 'lesson_completed') {
        const m = modules.find((x) => x.id === e.refId);
        return {
          id: e.id,
          text: `Completed module: ${m?.title ?? e.refId}`,
          to: `/learn/${e.refId}`,
          at: e.createdAt,
        };
      }
      if (e.kind === 'activity_completed') {
        const l = labs.find((x) => x.id === e.refId);
        return {
          id: e.id,
          text: `Completed lab: ${l?.title ?? e.refId}`,
          to: l?.to ?? '/lab',
          at: e.createdAt,
        };
      }
      if (e.kind === 'quest_stage') {
        const questId = e.refId.split(':')[0] ?? '';
        const q = quests.find((x) => x.id === questId);
        return {
          id: e.id,
          text: `Answered quest question: ${q?.title ?? questId}`,
          to: `/quests/${questId}`,
          at: e.createdAt,
        };
      }
      const a = findAssessment(e.refId);
      const quest = quests.find((q) =>
        q.stages.some((s) => s.kind === 'check' && s.assessmentId === e.refId),
      );
      return {
        id: e.id,
        text: a ? `Submitted: ${a.title}` : 'Submitted an assessment',
        to: quest ? `/quests/${quest.id}/check` : '/assess',
        at: e.createdAt,
      };
    });
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

/** "2 minutes ago", "yesterday", ... */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return rtf.format(seconds, 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  return rtf.format(Math.round(seconds / 86400), 'day');
}
