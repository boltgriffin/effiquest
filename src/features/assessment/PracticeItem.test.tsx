import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { NumericItem } from '@/types';
import { PracticeItem } from './PracticeItem';

const item: NumericItem = {
  id: 'p',
  kind: 'numeric',
  prompt: 'A 25 N force acts at right angles, 0.40 m from a pivot. What is the torque?',
  answer: 10,
  tolerance: 0.1,
  unit: 'N·m',
  objective: 'SRC-O1',
  misconceptionId: 'G1',
  explanation: 'τ = r F = 10 N·m.',
  status: 'draft',
};

describe('PracticeItem', () => {
  it('gives a second try, then shows the answer; can be tried again', () => {
    render(<PracticeItem item={item} />);
    const field = screen.getByLabelText(/Your answer/);
    fireEvent.change(field, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Not quite')).toBeInTheDocument();
    expect(screen.queryByText('τ = r F = 10 N·m.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Check again' }));
    expect(screen.getByText('Not correct')).toBeInTheDocument();
    expect(screen.getByText('τ = r F = 10 N·m.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Your answer/)).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Try this question again' }));
    fireEvent.change(screen.getByLabelText(/Your answer/), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByText('Correct')).toBeInTheDocument();
  });

  it('does not use a try on an unreadable number', () => {
    render(<PracticeItem item={item} />);
    fireEvent.change(screen.getByLabelText(/Your answer/), { target: { value: '10 N' } });
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
    expect(screen.getByText(/without the unit/)).toBeInTheDocument();
  });
});
