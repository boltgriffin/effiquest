import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { listAttempts, listResponses, loadDraft } from '@/services/storage/attempts';
import { listProgress } from '@/services/storage/progress';
import type { Assessment } from '@/types';
import { AssessmentRunner } from './AssessmentRunner';

const base = { objective: 'SRC-O2', explanation: 'Explained here.', status: 'draft' as const };

const items: Assessment['items'] = [
  {
    ...base,
    id: 'tf',
    kind: 'truefalse',
    prompt: 'A machine that reduces effort is always efficient.',
    misconceptionId: 'G2',
    answer: false,
  },
  {
    ...base,
    id: 'num',
    kind: 'numeric',
    prompt: 'Useful 200 J, input 250 J. Efficiency?',
    misconceptionId: 'G5',
    answer: 80,
    tolerance: 0.5,
    unit: '%',
  },
];

const make = (mode: 'test' | 'practice', id: string): Assessment => ({
  id,
  kind: mode === 'test' ? 'baseline' : 'quest_check',
  mode,
  title: `Runner ${mode}`,
  version: '1',
  revealAnswers: mode === 'practice',
  items,
});

const renderRunner = (a: Assessment, owner: string) =>
  render(
    <MemoryRouter>
      <AssessmentRunner assessment={a} ownerId={owner} />
    </MemoryRouter>,
  );

describe('AssessmentRunner, practice mode', () => {
  it('gives feedback, allows one retry, then shows the answer; scores first-try answers only', async () => {
    const a = make('practice', 'p1');
    renderRunner(a, 'P-01');

    fireEvent.click(await screen.findByRole('radio', { name: /True/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(await screen.findByText('Not quite')).toBeInTheDocument();
    expect(screen.queryByText('Explained here.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    // Same wrong answer twice: the try is used up and the answer is revealed.
    expect(await screen.findByText('Not correct')).toBeInTheDocument();
    expect(screen.getByText('Explained here.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /True/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Next question/ }));
    const field = await screen.findByLabelText(/Your answer/);
    fireEvent.change(field, { target: { value: '80 %' } });
    expect(screen.getByText(/number only, without the unit/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    fireEvent.change(field, { target: { value: '80.4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(await screen.findByText('Correct')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'See my results' }));
    expect(await screen.findByText('Strengths and areas to improve')).toBeInTheDocument();

    const [attempt] = await listAttempts('P-01');
    expect(attempt).toMatchObject({ score: 1, maxScore: 2, mode: 'practice' });
    const rows = await listResponses(attempt?.id ?? '');
    expect(rows.find((r) => r.itemId === 'tf')).toMatchObject({ tries: 2, points: 0 });
    expect((await listProgress('P-01')).map((e) => e.kind)).toEqual(['assessment_submitted']);
    expect(await loadDraft('P-01', 'p1')).toBeUndefined();
  });
});

describe('AssessmentRunner, test mode', () => {
  it('shows no feedback before submission and keeps answers across a remount', async () => {
    const a = make('test', 't1');
    const first = renderRunner(a, 'T-01');

    fireEvent.click(await screen.findByRole('radio', { name: /False/ }));
    expect(screen.queryByRole('button', { name: /Check/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(await screen.findByLabelText(/Your answer/), { target: { value: '75' } });
    // Leaving the page saves the draft (as a refresh would).
    first.unmount();
    await waitFor(async () => expect((await loadDraft('T-01', 't1'))?.responses.num).toBe('75'));

    renderRunner(a, 'T-01');
    expect(await screen.findByText(/earlier answers were kept/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your answer/)).toHaveValue('75');
    fireEvent.click(screen.getByRole('button', { name: 'Review answers' }));
    expect(await screen.findByText('Question 1: answered')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit answers' }));

    expect(await screen.findByText('Why the answers are not shown')).toBeInTheDocument();
    const [attempt] = await listAttempts('T-01');
    expect(attempt).toMatchObject({ score: 1, maxScore: 2, kind: 'baseline' });
  });
});
