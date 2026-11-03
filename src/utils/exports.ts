export type ExportColumn<T> = {
  key: string;
  label: string;
  getValue: (row: T) => string;
};

const normalizeForPdf = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[—–]/g, '-')
  .replace(/[’‘]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/º/g, 'o')
  .replace(/·/g, '-')
  .replace(/[^\x20-\x7E]/g, '?');

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`;

export const createCsvContent = <T,>(rows: T[], columns: ExportColumn<T>[]) => {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(';');
  const body = rows.map((row) => columns.map((column) => escapeCsvValue(column.getValue(row))).join(';'));
  return `\ufeff${[header, ...body].join('\r\n')}`;
};

/** @deprecated Use createReportHtml with openPrintReport for application PDF exports. */
export const createPdfContent = <T,>(title: string, rows: T[], columns: ExportColumn<T>[]) => {
  const generatedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date());
  const tableHeader = columns.map((column) => column.label).join(' | ');
  const tableRows = rows.map((row) => columns.map((column) => column.getValue(row)).join(' | '));
  const rawLines = [title, `Gerado em ${generatedAt}`, '', tableHeader, ...tableRows];
  const lines = rawLines.flatMap((line) => {
    const normalized = normalizeForPdf(line);
    if (normalized.length <= 112) {
      return [normalized];
    }

    const chunks: string[] = [];
    for (let index = 0; index < normalized.length; index += 112) {
      chunks.push(normalized.slice(index, index + 112));
    }
    return chunks;
  });
  const linesPerPage = 54;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / linesPerPage)) }, (_, index) => lines.slice(index * linesPerPage, (index + 1) * linesPerPage));
  const objects: string[] = [];
  const pageIds: number[] = [];

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';

  pages.forEach((pageLines, pageIndex) => {
    const pageId = 4 + pageIndex * 2;
    const contentId = pageId + 1;
    pageIds.push(pageId);
    const textCommands = pageLines.map((line, lineIndex) => {
      const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
      return `${lineIndex === 0 ? '0 0 Td' : '0 -14 Td'} (${escaped}) Tj`;
    }).join('\n');
    const stream = `BT /F1 8 Tf 36 806 Td\n${textCommands}\nET`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (let id = 1; id < objects.length; id += 1) {
    if (!objects[id]) {
      continue;
    }
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id] ?? 0).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
};

export const downloadTextFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
