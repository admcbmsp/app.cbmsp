import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { InventoryColumnKey } from '../types/inventory';
import type { InventoryGroupColumnKey } from '../types/inventoryViews';
import { InventoryViewTemplates } from './InventoryViewTemplates';

const originalInnerWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth');

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
}

function renderTemplates() {
  return render(
    <InventoryViewTemplates
      userId="inventory-view-templates-test"
      autoApplyDefaultOnEntry={false}
      filters={null}
      columns={['nrPatrimonio'] as InventoryColumnKey[]}
      groupColumns={['description'] as InventoryGroupColumnKey[]}
      onApply={jest.fn()}
      onToast={jest.fn()}
    />,
  );
}

afterEach(() => {
  window.localStorage.clear();
  if (originalInnerWidth) {
    Object.defineProperty(window, 'innerWidth', originalInnerWidth);
  }
});

test('opens the saved views as a bottom drawer on mobile', async () => {
  setViewportWidth(375);
  renderTemplates();

  fireEvent.click(screen.getByRole('button', { name: /modelos/i }));

  const dialog = await screen.findByRole('dialog', { name: 'Modelos salvos' });
  await screen.findByText('Nenhum template salvo ainda.');

  expect(dialog).toHaveAttribute('aria-modal', 'true');
  expect(dialog).toHaveClass('dialog-panel', 'rounded-t-md');
  expect(dialog.parentElement).toHaveClass('items-end', 'p-0');

  fireEvent.click(screen.getByRole('button', { name: 'Fechar modelos' }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Modelos salvos' })).not.toBeInTheDocument());
});

test('keeps the saved views as a popover above the mobile breakpoint', async () => {
  setViewportWidth(768);
  renderTemplates();

  fireEvent.click(screen.getByRole('button', { name: /modelos/i }));

  const dialog = await screen.findByRole('dialog', { name: 'Templates de filtros e colunas' });
  await screen.findByText('Nenhum template salvo ainda.');

  expect(dialog).toHaveClass('absolute', 'right-0');
  expect(dialog).not.toHaveAttribute('aria-modal', 'true');
});
