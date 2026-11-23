import { describe, expect, it } from 'vitest';
import { findQuest } from '@/content/quests';
import type { ProgressEvent, ProgressEventKind } from '@/types';
import { currentQuest, questProgress, recentActivity, relativeTime, summarize } from './progress';

let n = 0;
const ev = (kind: ProgressEventKind, refId: string): ProgressEvent => ({
  id: `e${n++}`,
  ownerId: 'T1',
  kind,
  refId,
  createdAt: new Date(Date.UTC(2026, 10, 25, 8, n)).toISOString(),
});

const quest = findQuest('effort-vs-efficiency');
if (!quest) throw new Error('quest missing');

describe('questProgress', () => {
  it('starts at zero with the lesson as the next stage', () => {
    const p = questProgress([], quest);
    expect(p).toMatchObject({ done: 0, total: 4, complete: false });
    expect(p.nextStage?.kind).toBe('lesson');
  });

  it('derives lesson and lab stages from module and lab completion', () => {
    const p = questProgress(
      [ev('lesson_completed', 'advantage-efficiency'), ev('activity_completed', 'incline')],
      quest,
    );
    expect(p.done).toBe(2);
    expect(p.nextStage?.kind).toBe('check');
  });

  it('counts the knowledge check once a practice attempt is submitted', () => {
    const p = questProgress(
      [
        ev('lesson_completed', 'advantage-efficiency'),
        ev('activity_completed', 'incline'),
        ev('assessment_submitted', 'check-effort-vs-efficiency'),
      ],
      quest,
    );
    expect(p.done).toBe(3);
    expect(p.nextStage?.kind).toBe('reflect');
  });

  it('is complete once the quest question is answered', () => {
    const p = questProgress(
      [
        ev('lesson_completed', 'advantage-efficiency'),
        ev('activity_completed', 'incline'),
        ev('assessment_submitted', 'check-effort-vs-efficiency'),
        ev('quest_stage', 'effort-vs-efficiency:reflect'),
      ],
      quest,
    );
    expect(p.complete).toBe(true);
    expect(p.nextStage).toBeUndefined();
  });
});

describe('currentQuest', () => {
  it('defaults to the first quest', () => {
    expect(currentQuest([])?.quest.id).toBe('effort-vs-efficiency');
  });

  it('follows the quest most recently worked on', () => {
    expect(currentQuest([ev('lesson_completed', 'torque')])?.quest.id).toBe('turning-forces');
  });

  it('skips finished quests', () => {
    const events = [
      ev('lesson_completed', 'torque'),
      ev('activity_completed', 'lever'),
      ev('assessment_submitted', 'check-turning-forces'),
      ev('quest_stage', 'turning-forces:reflect'),
    ];
    expect(currentQuest(events)?.quest.id).toBe('effort-vs-efficiency');
  });
});

describe('summarize and recentActivity', () => {
  it('counts distinct completions, ignoring repeats', () => {
    const events = [
      ev('lesson_completed', 'torque'),
      ev('lesson_completed', 'torque'),
      ev('activity_completed', 'incline'),
    ];
    expect(summarize(events)).toMatchObject({ modulesDone: 1, labsDone: 1, questsDone: 0 });
  });

  it('counts lessons opened, checks done and every assessment attempt', () => {
    const events = [
      ev('lesson_opened', 'torque'),
      ev('lesson_opened', 'torque'),
      ev('lesson_completed', 'hydraulics'),
      ev('assessment_submitted', 'check-turning-forces'),
      ev('assessment_submitted', 'check-turning-forces'),
      ev('assessment_submitted', 'diagnostic-baseline'),
    ];
    expect(summarize(events)).toMatchObject({
      lessonsOpened: 2,
      checksDone: 1,
      checksTotal: 4,
      assessmentAttempts: 3,
    });
  });

  it('leaves lesson openings out of recent activity and names assessments', () => {
    const items = recentActivity([
      ev('lesson_opened', 'torque'),
      ev('assessment_submitted', 'check-turning-forces'),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      text: 'Submitted: Knowledge check: pushing straight, turning round',
      to: '/quests/turning-forces/check',
    });
  });

  it('lists newest first with destinations', () => {
    const items = recentActivity([
      ev('lesson_completed', 'torque'),
      ev('activity_completed', 'incline'),
    ]);
    expect(items[0]).toMatchObject({ text: 'Completed lab: Inclined plane', to: '/lab/incline' });
    expect(items[1]).toMatchObject({ to: '/learn/torque' });
  });
});

describe('relativeTime', () => {
  it('formats past times', () => {
    const now = new Date('2026-11-25T10:00:00Z');
    expect(relativeTime('2026-11-25T09:58:00Z', now)).toBe('2 minutes ago');
    expect(relativeTime('2026-11-24T10:00:00Z', now)).toBe('yesterday');
  });
});
