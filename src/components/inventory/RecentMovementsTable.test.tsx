import { fireEvent, render, screen } from '@testing-library/react';
import { inventorySeed } from '../../data/inventory';
import { RecentMovementsTable } from './RecentMovementsTable';

const item = inventorySeed[0];
const movement = { item, entry: item.history[0] };

test('shows labeled movement cards on compact layouts and preserves row activation', () => {
  const onActivate = jest.fn();
  const { container } = render(<RecentMovementsTable movements={[movement]} onActivate={onActivate} />);

  const cards = container.querySelector('.xl\\:hidden');
  const card = cards?.querySelector('button');

  expect(cards).toBeInTheDocument();
  expect(card).toBeInTheDocument();
  expect(card?.getAttribute('aria-label')).toContain(movement.entry.summary);
  expect(card?.getAttribute('aria-label')).toContain(movement.entry.userName);
  expect(cards).toHaveTextContent('Data');
  expect(cards).toHaveTextContent('Responsável');
  expect(card?.querySelector('time')).toHaveAttribute('dateTime', movement.entry.timestamp);

  fireEvent.click(card as HTMLButtonElement);

  expect(onActivate).toHaveBeenCalledWith(movement);
});

test('shows the full recent movements table at extra-large widths', () => {
  const { container } = render(<RecentMovementsTable movements={[movement]} onActivate={jest.fn()} />);

  expect(container.querySelector('.hidden.xl\\:block')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Movimentações recentes' })).toBeInTheDocument();
});
