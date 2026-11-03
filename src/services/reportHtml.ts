import type { ExportColumn } from '../utils/exports';

type ReportHtmlOptions<T> = {
  title: string;
  rows: T[];
  columns: ExportColumn<T>[];
  generatedBy: {
    name: string;
    email: string;
  };
};

const reportDesignTokens = `
  :root {
    --report-ink: #172b3f;
    --report-muted: #607285;
    --report-primary: #173b5e;
    --report-accent: #c82e3d;
    --report-border: #d8e1e9;
    --report-surface: #f2f5f8;
    --report-radius: 4px;
  }
`;

const reportStyles = `
  ${reportDesignTokens}

  * { box-sizing: border-box; }

  html {
    background: #e8edf2;
  }

  body {
    margin: 0;
    color: var(--report-ink);
    font-family: Arial, "Helvetica Neue", sans-serif;
    font-size: 13px;
    line-height: 1.45;
  }

  .report-page {
    width: min(100%, 1440px);
    min-height: 100vh;
    margin: 0 auto;
    padding: 42px 48px;
    background: #fff;
  }

  .report-header {
    display: flex;
    align-items: flex-start;
    gap: 18px;
    padding-bottom: 22px;
    border-bottom: 3px solid var(--report-accent);
  }

  .brand-mark {
    display: grid;
    width: 54px;
    height: 54px;
    flex: 0 0 54px;
    place-content: center;
    border-radius: var(--report-radius);
    background: var(--report-primary);
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .08em;
    line-height: 1.2;
    text-align: center;
  }

  .report-heading { flex: 1; }

  .report-eyebrow {
    margin: 0 0 5px;
    color: var(--report-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: var(--report-primary);
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
  }

  .report-subtitle {
    margin: 6px 0 0;
    color: var(--report-muted);
    font-size: 12px;
  }

  .generated-at {
    max-width: 240px;
    min-width: 150px;
    margin: 2px 0 0;
    color: var(--report-muted);
    font-size: 10px;
    overflow-wrap: anywhere;
    text-align: right;
  }

  .report-summary {
    display: flex;
    gap: 12px;
    margin: 20px 0;
  }

  .summary-card {
    min-width: 140px;
    padding: 11px 15px;
    border: 1px solid var(--report-border);
    border-radius: var(--report-radius);
    background: var(--report-surface);
  }

  .summary-label {
    display: block;
    color: var(--report-muted);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
  }

  .summary-value {
    display: block;
    margin-top: 3px;
    color: var(--report-primary);
    font-size: 18px;
    font-weight: 700;
  }

  .table-wrap { width: 100%; }

  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }

  thead {
    display: table-header-group;
    background: var(--report-primary);
    color: #fff;
  }

  th, td {
    padding: 9px 10px;
    border-bottom: 1px solid var(--report-border);
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  th {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .04em;
    line-height: 1.35;
  }

  td { font-size: 10px; }

  tbody tr:nth-child(even) { background: var(--report-surface); }

  .row-number {
    width: 32px;
    color: var(--report-muted);
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }

  .empty-row {
    padding: 24px;
    color: var(--report-muted);
    text-align: center;
  }

  .report-footer {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px solid var(--report-border);
    color: var(--report-muted);
    font-size: 9px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @page {
    size: A4 landscape;
    margin: 12mm;
  }

  @media print {
    html, body { background: #fff; }

    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .report-page {
      width: 100%;
      min-height: 0;
      padding: 0;
    }

    .report-header, .report-summary, tr, .report-footer {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    thead { display: table-header-group; }
  }
`;

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatReportCount = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

export const createReportHtml = <T,>({ title, rows, columns, generatedBy }: ReportHtmlOptions<T>) => {
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date());
  const safeTitle = escapeHtml(title);
  const headerCells = columns.map((column) => `<th scope="col">${escapeHtml(column.label)}</th>`).join('');
  const tableRows = rows.map((row, rowIndex) => {
    const cells = columns.map((column) => `<td>${escapeHtml(column.getValue(row))}</td>`).join('');
    return `<tr><td class="row-number">${formatReportCount(rowIndex + 1)}</td>${cells}</tr>`;
  }).join('');
  const emptyRow = `<tr><td class="empty-row" colspan="${columns.length + 1}">Nenhum registro encontrado para este relatório.</td></tr>`;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <style>${reportStyles}</style>
  </head>
  <body>
    <main class="report-page">
      <header class="report-header">
        <div class="brand-mark" aria-label="CBM SP">CBM<br>SP</div>
        <div class="report-heading">
          <p class="report-eyebrow">Corpo de Bombeiros Militar do Estado de São Paulo</p>
          <h1>${safeTitle}</h1>
          <p class="report-subtitle">Relatório patrimonial</p>
        </div>
        <p class="generated-at">
          Gerado por<br>
          <strong>${escapeHtml(generatedBy.name)}</strong><br>
          ${escapeHtml(generatedBy.email)}<br>
          em <strong>${escapeHtml(generatedAt)}</strong>
        </p>
      </header>

      <section class="report-summary" aria-label="Resumo do relatório">
        <div class="summary-card">
          <span class="summary-label">Linhas</span>
          <strong class="summary-value">${formatReportCount(rows.length)}</strong>
        </div>
        <div class="summary-card">
          <span class="summary-label">Campos</span>
          <strong class="summary-value">${formatReportCount(columns.length)}</strong>
        </div>
      </section>

      <div class="table-wrap">
        <table>
          <caption class="sr-only">${safeTitle}</caption>
          <thead><tr><th scope="col" class="row-number">Nº</th>${headerCells}</tr></thead>
          <tbody>${tableRows || emptyRow}</tbody>
        </table>
      </div>

      <footer class="report-footer">
        <span>Relatório gerado localmente a partir dos dados disponíveis para este perfil.</span>
        <span>${formatReportCount(rows.length)} linha(s)</span>
      </footer>
    </main>
  </body>
</html>`;
};
