import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Tabs } from './Tabs';

const items = [
  { id: 'a', label: 'Alpha', content: <p>Panel A</p> },
  { id: 'b', label: 'Beta', content: <p>Panel B</p> },
  { id: 'c', label: 'Gamma', content: <p>Panel C</p> },
];

describe('Tabs', () => {
  it('shows the first panel and marks its tab selected', () => {
    render(<Tabs label="Test" items={items} />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A');
  });

  it('moves selection and focus with arrow, Home and End keys (wrapping)', () => {
    render(<Tabs label="Test" items={items} />);
    const alpha = screen.getByRole('tab', { name: 'Alpha' });
    fireEvent.keyDown(alpha, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Beta' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Gamma' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Alpha' }), { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveFocus();
  });

  it('keeps only the selected tab in the tab order', () => {
    render(<Tabs label="Test" items={items} />);
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('tabindex', '-1');
  });
});
