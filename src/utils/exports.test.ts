import { createCsvContent, createPdfContent, ExportColumn } from './exports';

type Row = { name: string; status: string };

const columns: ExportColumn<Row>[] = [
  { key: 'name', label: 'Nome', getValue: (row) => row.name },
  { key: 'status', label: 'Status', getValue: (row) => row.status },
];

const rows: Row[] = [{ name: 'Mangueira — teste', status: 'Ativo' }];

test('creates a semicolon separated CSV with UTF-8 marker', () => {
  const csv = createCsvContent(rows, columns);

  expect(csv.startsWith('\ufeff')).toBe(true);
  expect(csv).toContain('"Nome";"Status"');
  expect(csv).toContain('"Mangueira — teste";"Ativo"');
});

test('creates a PDF document with normalized text and table rows', () => {
  const pdf = createPdfContent('Relatório patrimonial', rows, columns);

  expect(pdf.startsWith('%PDF-1.4')).toBe(true);
  expect(pdf).toContain('/Type /Catalog');
  expect(pdf).toContain('Mangueira - teste');
  expect(pdf.endsWith('%%EOF')).toBe(true);
});
