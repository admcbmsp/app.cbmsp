import { render, screen } from '@testing-library/react';
import type { AppUser } from '../types/inventory';
import { InventoryShell } from './InventoryShell';

const user: AppUser = {
  id: 'test-user',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'reader',
  patente: '',
  unidade: '',
  telefoneContato: '',
};

test('sets a definite pixel height on the main content area', () => {
  const { container } = render(
    <InventoryShell
      user={user}
      page="profile"
      onNavigate={jest.fn()}
      onLogout={jest.fn()}
      onExportAll={jest.fn()}
      selectedUnit={null}
      onSelectUnit={jest.fn()}
      theme="light"
      onToggleTheme={jest.fn()}
    >
      <>
        <section aria-labelledby="profile-page-title" data-testid="first-view-section" />
        <section data-testid="second-view-section" />
      </>
    </InventoryShell>,
  );
  const expectedShellHeight = Math.max(window.innerHeight, 667);
  const main = container.querySelector('.application-main') as HTMLElement;
  const viewSlot = container.querySelector('.application-view-slot') as HTMLElement;

  expect(container.querySelector('.application-shell')).toHaveStyle({ height: `${expectedShellHeight}px` });
  expect(container.querySelector('.application-shell')).toHaveClass('overflow-hidden');
  expect(main).toHaveClass('overflow-x-hidden', 'overscroll-y-contain');
  expect(main.style.height).toBe('');
  expect(viewSlot).toHaveClass('flex', 'flex-col');
  expect(viewSlot.children[0]).toBe(screen.getByTestId('first-view-section'));
  expect(viewSlot.children[1]).toBe(screen.getByTestId('second-view-section'));
});
