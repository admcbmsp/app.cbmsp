import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { DynamicDataTable } from './DynamicDataTable';
import type { DynamicDataTableColumn } from './DynamicDataTable';

type RecordRow = {
  id: string;
  asset: string;
  city: string;
  value: number;
};

type ColumnKey = 'asset' | 'city' | 'value';

const rows: RecordRow[] = [
  { id: 'row-b', asset: 'Mangueira', city: 'EB ITAPIRA', value: 120 },
  { id: 'row-a', asset: 'Ferramenta', city: 'EB HOLAMBRA', value: 45 },
];

const columns: DynamicDataTableColumn<RecordRow, ColumnKey>[] = [
  { key: 'asset', label: 'Patrimônio', locked: true, sortValue: (row) => row.asset, renderCell: (row) => row.asset },
  { key: 'city', label: 'Unidade', sortValue: (row) => row.city, renderCell: (row) => row.city },
  { key: 'value', label: 'Valor', numeric: true, sortValue: (row) => row.value, renderCell: (row) => String(row.value) },
];

const renderTable = (
  visibleColumnKeys: ColumnKey[] = ['asset', 'city', 'value'],
  onAction: (row: RecordRow) => void = () => undefined,
  onRowClick?: (row: RecordRow) => void,
) => {
  function TableHarness() {
    const [selectedColumns, setSelectedColumns] = useState(visibleColumnKeys);
    return (
      <DynamicDataTable
        ariaLabel="Tabela de teste"
        rows={rows}
        columns={columns}
        visibleColumnKeys={selectedColumns}
        defaultColumnKeys={['asset', 'city', 'value']}
        onVisibleColumnKeysChange={setSelectedColumns}
        getRowKey={(row) => row.id}
        getRowLabel={(row) => `Abrir item ${row.asset}`}
        onRowClick={onRowClick}
        getActionMenuLabel={(row) => `Ações para ${row.asset}`}
        getActions={(row) => [{ key: 'view', label: 'Ver item', icon: 'eye', onSelect: () => onAction(row) }]}
      />
    );
  }
  return render(<TableHarness />);
};

const headerLabels = (table: HTMLElement) =>
  Array.from(table.querySelectorAll('thead th')).map((header) => header.textContent?.trim());

test('allows hiding optional columns while keeping the required column and actions column', () => {
  renderTable();
  const table = screen.getByRole('table', { name: 'Tabela de teste' });

  fireEvent.click(screen.getByRole('button', { name: /configurar colunas/i }));
  expect(screen.getByRole('checkbox', { name: 'Patrimônio' })).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Unidade' }));

  expect(screen.queryByRole('columnheader', { name: 'Unidade' })).not.toBeInTheDocument();
  expect(headerLabels(table)).toEqual(['Patrimônio', 'Valor', 'Ações']);
});

test('reorders selected columns and always leaves actions at the end', () => {
  renderTable();
  const table = screen.getByRole('table', { name: 'Tabela de teste' });

  fireEvent.click(screen.getByRole('button', { name: /configurar colunas/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Mover Valor para cima' }));

  expect(headerLabels(table)).toEqual(['Patrimônio', 'Valor', 'Unidade', 'Ações']);
});

test('sorts rows by column value ascending, descending and back to source order', () => {
  renderTable();
  const table = screen.getByRole('table', { name: 'Tabela de teste' });
  const getFirstDataRow = () => within(table).getAllByRole('row')[1];

  fireEvent.click(screen.getByRole('button', { name: 'Valor' }));
  expect(getFirstDataRow()).toHaveTextContent('45');
  expect(screen.getByRole('columnheader', { name: 'Valor' })).toHaveAttribute('aria-sort', 'ascending');

  fireEvent.click(screen.getByRole('button', { name: 'Valor' }));
  expect(getFirstDataRow()).toHaveTextContent('120');
  expect(screen.getByRole('columnheader', { name: 'Valor' })).toHaveAttribute('aria-sort', 'descending');

  fireEvent.click(screen.getByRole('button', { name: 'Valor' }));
  expect(getFirstDataRow()).toHaveTextContent('120');
  expect(screen.getByRole('columnheader', { name: 'Valor' })).toHaveAttribute('aria-sort', 'none');

  fireEvent.change(screen.getByLabelText('Ordenar por'), { target: { value: 'value' } });
  expect(getFirstDataRow()).toHaveTextContent('45');
  fireEvent.click(screen.getByRole('button', { name: 'Inverter ordem. Atual: crescente' }));
  expect(getFirstDataRow()).toHaveTextContent('120');
});

test('provides a field label for each responsive card cell', () => {
  renderTable();
  const table = screen.getByRole('table', { name: 'Tabela de teste' });
  const firstDataRow = within(table).getAllByRole('row')[1];

  expect(within(firstDataRow).getAllByRole('cell').map((cell) => cell.getAttribute('data-label'))).toEqual([
    'Patrimônio',
    'Unidade',
    'Valor',
    'Ações',
  ]);
});

test('shows row actions in a three-dot menu and runs the selected action', () => {
  const onAction = jest.fn();
  renderTable(undefined, onAction);

  fireEvent.click(screen.getByRole('button', { name: 'Ações para Mangueira' }));
  expect(screen.getByRole('menu', { name: 'Ações para Mangueira' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Ver item' }));

  expect(onAction).toHaveBeenCalledWith(rows[0]);
  expect(screen.queryByRole('menu', { name: 'Ações para Mangueira' })).not.toBeInTheDocument();
});

test('opens a row from any cell or keyboard while keeping the action menu separate', () => {
  const onRowClick = jest.fn();
  renderTable(undefined, undefined, onRowClick);

  const table = screen.getByRole('table', { name: 'Tabela de teste' });
  const row = within(table).getByRole('row', { name: 'Abrir item Mangueira' });
  fireEvent.click(within(row).getByRole('cell', { name: 'EB ITAPIRA' }));
  expect(onRowClick).toHaveBeenCalledWith(rows[0]);

  onRowClick.mockClear();
  fireEvent.click(screen.getByRole('button', { name: 'Ações para Mangueira' }));
  expect(onRowClick).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Escape' });

  fireEvent.keyDown(row, { key: 'Enter' });
  expect(onRowClick).toHaveBeenCalledWith(rows[0]);
});
