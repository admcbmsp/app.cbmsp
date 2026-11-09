import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';
import { inventorySeed } from './data/inventory';
import { patrimonioSalvamentoNumbers } from './data/patrimonySalvamento';
import { City, itemStatuses, operationalStatuses, operationalStatusLabels, statusLabels } from './types/inventory';
import { formatCurrency } from './utils/inventory';
import { parseAppRoute } from './utils/appRouting';

beforeEach(() => {
  window.history.replaceState(window.history.state, '', '#/dashboard');
  window.localStorage.removeItem('cbmsp-theme');
  document.documentElement.classList.remove('dark');
  document.documentElement.style.colorScheme = 'light';
});

const loginAs = (userName: RegExp) => {
  fireEvent.click(screen.getByRole('button', { name: userName }));
  fireEvent.click(screen.getByRole('button', { name: /entrar no prot/i }));
};

const logoutFromSideNav = () => {
  fireEvent.click(screen.getByRole('button', { name: /abrir navega/i }));
  fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
};

const openInventory = async () => {
  fireEvent.click(screen.getByRole('button', { name: /abrir navega/i }));
  fireEvent.click(screen.getByRole('link', { name: /consulta de ativos|controle de patrimônio|estoque patrimonial/i }));
  await waitFor(() => expect(screen.getByRole('main')).not.toHaveAttribute('aria-hidden'));
};

test('loads the planned mock inventory size', () => {
  expect(inventorySeed).toHaveLength(patrimonioSalvamentoNumbers.length);
  expect(inventorySeed.map((item) => item.nrPatrimonio)).toEqual([...patrimonioSalvamentoNumbers]);
  expect(inventorySeed.every((item) => item.uuid && item.status)).toBe(true);
  expect(inventorySeed.every((item) => item.quantidade === 1)).toBe(true);
});

test('allows repeated descriptions with unique patrimony numbers', () => {
  const rescueVehicles = inventorySeed.filter((item) => item.description === 'Viatura de Resgate e Salvamento');
  const patrimonies = new Set(rescueVehicles.map((item) => item.nrPatrimonio));
  const good = rescueVehicles.filter((item) => item.state === 'bom');
  const regular = rescueVehicles.filter((item) => item.state === 'regular');

  expect(rescueVehicles).toHaveLength(6);
  expect(patrimonies.size).toBe(rescueVehicles.length);
  expect(good).toHaveLength(3);
  expect(regular).toHaveLength(3);
});

test('renders the prototype login screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /entrar no almoxarifado/i })).toBeInTheDocument();
  expect(screen.getByText(/acesso rápido por perfil/i)).toBeInTheDocument();
  const login = screen.getByRole('main');
  expect(login).toHaveStyle({ minHeight: `${Math.max(window.innerHeight, 667)}px` });
  expect(login.style.height).toBe('');
  expect(login.querySelector('.bg-slate-50')).not.toHaveClass('min-h-screen');
});

test('reader can access the stock but cannot create items', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /mariana costa/i }));
  fireEvent.click(screen.getByRole('button', { name: /entrar no protótipo/i }));
  fireEvent.click(screen.getByRole('button', { name: /abrir navegação/i }));
  fireEvent.click(screen.getByRole('link', { name: /consulta de ativos|controle de patrimônio|estoque patrimonial/i }));

  expect(screen.getByText('Bens cadastrados')).toBeInTheDocument();
  expect(screen.getByText(/resultado\(s\)/i)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /novo item/i })).not.toBeInTheDocument();
});

test('suggests descriptions after three letters and summarizes the selected description', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /mariana costa/i }));
  fireEvent.click(screen.getByRole('button', { name: /entrar no protótipo/i }));
  fireEvent.click(screen.getByRole('button', { name: /abrir navegação/i }));
  fireEvent.click(screen.getByRole('link', { name: /consulta de ativos|controle de patrimônio|estoque patrimonial/i }));
  await waitFor(() => expect(screen.getByRole('main')).not.toHaveAttribute('aria-hidden'));

  const search = screen.getByLabelText(/descrição ou patrimônio/i);
  fireEvent.change(search, { target: { value: 'Salv' } });

  const suggestion = screen.getByRole('button', { name: /Viatura de Resgate e Salvamento 6 item/i });
  expect(suggestion).toBeInTheDocument();
  fireEvent.click(suggestion);

  fireEvent.click(screen.getByRole('button', { name: /fazer resumo/i }));
  const summary = screen.getByRole('region', { name: /resumo da busca/i });

  expect(within(summary).getByText('6')).toBeInTheDocument();
  expect(within(summary).getByText('itens no total')).toBeInTheDocument();
  expect(within(summary).getByText('Bom')).toBeInTheDocument();
  expect(within(summary).getByText('Regular')).toBeInTheDocument();
});

test('admin sees the create action after login', () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /cap\. eduardo santos/i }));
  fireEvent.click(screen.getByRole('button', { name: /entrar no protótipo/i }));

  expect(screen.getAllByRole('button', { name: /novo item/i }).length).toBeGreaterThan(0);
});

test('uses the shared backdrop effect for side navigation and dialogs', async () => {
  render(<App />);
  loginAs(/rafael almeida/i);

  fireEvent.click(screen.getByRole('button', { name: /abrir navegação/i }));
  const sideNavigation = screen.getByRole('navigation', { name: /navegação/i });
  const sideNavigationBackdrop = screen.getByRole('button', { name: 'Fechar navegação lateral' });
  expect(sideNavigationBackdrop).toHaveClass('application-backdrop');
  expect(within(screen.getByRole('banner')).getByText('CBM SP')).toBeInTheDocument();
  expect(within(sideNavigation).queryByText('CBM SP')).not.toBeInTheDocument();
  expect(within(screen.getByRole('banner')).getByText('Rafael Almeida')).toBeInTheDocument();
  expect(within(sideNavigation).queryByText('Rafael Almeida')).not.toBeInTheDocument();
  expect(within(screen.getByRole('banner')).queryByText(/Unidade:/i)).not.toBeInTheDocument();
  expect(within(sideNavigation).getByRole('button', { name: /selecionar unidade/i })).toHaveTextContent('Todas as unidades');
  expect(within(sideNavigation).queryByRole('button', { name: 'Fechar navegação' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Fechar navegação' }));
  await waitFor(() => expect(screen.queryByRole('navigation', { name: /navegação/i })).not.toBeInTheDocument());

  fireEvent.click(screen.getByRole('button', { name: /novo item/i }));
  const dialog = screen.getByRole('dialog');
  expect(dialog.parentElement?.querySelector('.application-backdrop')).toBeInTheDocument();
});

test('almoxarife creates a pending item and sees the pending dashboard card', () => {
  render(<App />);
  loginAs(/rafael almeida/i);

  fireEvent.click(screen.getByRole('button', { name: /novo item/i }));
  expect(screen.queryByLabelText('Quantidade')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/descrição do item/i), { target: { value: 'Motosserra para aprovação' } });
  fireEvent.change(screen.getByLabelText(/cidade\/unidade/i), { target: { value: 'Ita' } });
  fireEvent.click(screen.getByRole('option', { name: 'Itapira' }));
  fireEvent.change(screen.getByLabelText(/valor unitário/i), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }));

  expect(screen.getByText(/novo item criado como pendente/i)).toBeInTheDocument();
  expect(screen.getByText('Motosserra para aprovação')).toBeInTheDocument();
  expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0);
});

test('city autocomplete limits suggestions and requires an offered city', () => {
  render(<App />);
  loginAs(/rafael almeida/i);
  fireEvent.click(screen.getByRole('button', { name: /novo item/i }));

  const cityInput = screen.getByLabelText(/cidade\/unidade/i);
  fireEvent.focus(cityInput);
  fireEvent.change(cityInput, { target: { value: '' } });

  const cityList = screen.getByRole('listbox');
  expect(within(cityList).getAllByRole('option')).toHaveLength(4);

  fireEvent.change(cityInput, { target: { value: 'Ita' } });
  expect(within(screen.getByRole('listbox')).getByRole('option', { name: 'Itapira' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('option', { name: 'Itapira' }));
  expect(cityInput).toHaveValue('Itapira');
});

test('gestor approves a pending item and it becomes visible to the reader', async () => {
  render(<App />);
  loginAs(/rafael almeida/i);
  fireEvent.click(screen.getByRole('button', { name: /novo item/i }));
  fireEvent.change(screen.getByLabelText(/descrição do item/i), { target: { value: 'Motosserra aprovada' } });
  fireEvent.change(screen.getByLabelText(/valor unitário/i), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }));

  logoutFromSideNav();
  loginAs(/eduardo santos/i);
  fireEvent.click(screen.getByRole('button', { name: /editar item pendente: Motosserra aprovada/i }));
  fireEvent.change(screen.getByLabelText(/^cadastro$/i), { target: { value: 'active' } });
  fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }));
  expect(screen.getByText(/registro atualizado com sucesso/i)).toBeInTheDocument();

  logoutFromSideNav();
  loginAs(/mariana costa/i);
  await openInventory();
  fireEvent.change(screen.getByLabelText(/descrição ou patrimônio/i), { target: { value: 'Motosserra aprovada' } });

  expect(screen.getAllByText('Motosserra aprovada').length).toBeGreaterThan(0);
});

test('gestor can reject a pending item and reader cannot consult it', async () => {
  render(<App />);
  loginAs(/rafael almeida/i);
  fireEvent.click(screen.getByRole('button', { name: /novo item/i }));
  fireEvent.change(screen.getByLabelText(/descrição do item/i), { target: { value: 'Motosserra rejeitada' } });
  fireEvent.change(screen.getByLabelText(/valor unitário/i), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }));

  logoutFromSideNav();
  loginAs(/eduardo santos/i);
  fireEvent.click(screen.getByRole('button', { name: /editar item pendente: Motosserra rejeitada/i }));
  fireEvent.change(screen.getByLabelText(/^cadastro$/i), { target: { value: 'rejected' } });
  fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }));
  expect(screen.getByText(/registro atualizado com sucesso/i)).toBeInTheDocument();

  logoutFromSideNav();
  loginAs(/mariana costa/i);
  await openInventory();
  fireEvent.change(screen.getByLabelText(/descrição ou patrimônio/i), { target: { value: 'Motosserra rejeitada' } });

  expect(screen.queryByText('Motosserra rejeitada')).not.toBeInTheDocument();
});

test('inventory offers history, operational status filtering and configurable columns', async () => {
  render(<App />);
  loginAs(/mariana costa/i);
  await openInventory();

  const groupedTable = screen.getByRole('table', { name: 'Patrimônios por descrição' });
  const groupedRow = within(groupedTable).getByRole('row', { name: 'Abrir patrimônios de Viatura de Resgate e Salvamento' });
  fireEvent.click(within(groupedRow).getByRole('cell', { name: 'Viatura de Resgate e Salvamento' }));
  fireEvent.click(screen.getAllByRole('button', { name: /ações para viatura de resgate e salvamento/i })[0]);
  fireEvent.click(screen.getByRole('menuitem', { name: /ver histórico/i }));
  expect(screen.getByRole('heading', { name: /histórico de alterações/i })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: /fechar histórico/i })[1]);

  fireEvent.click(screen.getByRole('button', { name: /colunas/i }));
  expect(screen.getByText('UUID')).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('UUID'));
  expect(screen.getByRole('columnheader', { name: 'UUID' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /exportar pdf/i })).toBeInTheDocument();
});

test('keeps logout in the side navigation and toggles the theme from the top bar', () => {
  render(<App />);
  loginAs(/mariana costa/i);

  expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ativar modo escuro/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /ativar modo escuro/i }));
  expect(document.documentElement).toHaveClass('dark');
  expect(screen.getByRole('button', { name: /ativar modo claro/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /ativar modo claro/i }));
  expect(document.documentElement).not.toHaveClass('dark');
});


test('groups patrimonies by description and opens all units with their details', async () => {
  render(<App />);
  loginAs(/eduardo santos/i);
  await openInventory();

  const vehicles = inventorySeed.filter((item) => item.description === 'Viatura de Resgate e Salvamento');
  const table = screen.getByRole('table', { name: 'Patrimônios por descrição' });
  const row = within(table).getByRole('row', { name: 'Abrir patrimônios de Viatura de Resgate e Salvamento' });
  expect(screen.getByRole('button', { name: /configurar colunas/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /configurar colunas/i }));
  expect(screen.getByRole('checkbox', { name: 'Item' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Concluir' }));
  expect(within(row).getByText('Viatura de Resgate e Salvamento')).toHaveClass('text-foreground');
  const cells = within(row).getAllByRole('cell');
  expect(cells.map((cell) => cell.getAttribute('data-label'))).toEqual([
    'Item',
    'Total',
    ...operationalStatuses.map((status) => operationalStatusLabels[status]),
    ...itemStatuses.map((status) => statusLabels[status]),
    'Ações',
  ]);
  expect(cells.slice(1, -1).map((cell) => cell.textContent)).toEqual([
    String(vehicles.length),
    ...['operacional', 'em-manutencao', 'inservivel', 'em-transito'].map((status) => String(vehicles.filter((item) => item.operationalStatus === status).length)),
    ...['active', 'pending', 'rejected', 'deactivated'].map((status) => String(vehicles.filter((item) => item.status === status).length)),
  ]);
  expect(cells[1]).toHaveTextContent('6');

  fireEvent.change(screen.getByLabelText(/descrição ou patrimônio/i), { target: { value: vehicles[0].nrPatrimonio } });
  const filteredRow = within(table).getByRole('row', { name: 'Abrir patrimônios de Viatura de Resgate e Salvamento' });
  fireEvent.click(within(filteredRow).getAllByRole('cell')[1]);
  expect(screen.getByRole('heading', { name: 'Viatura de Resgate e Salvamento' })).toBeInTheDocument();
  vehicles.forEach((item) => expect(screen.getByText(item.nrPatrimonio)).toBeInTheDocument());
  expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Número de patrimônio');
  expect(screen.queryByRole('columnheader', { name: 'Quantidade' })).not.toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Última movimentação' })).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /ações para viatura de resgate e salvamento/i })).toHaveLength(6);

  fireEvent.click(screen.getByRole('button', { name: /voltar ao estoque patrimonial/i }));
  expect(screen.getByLabelText(/descrição ou patrimônio/i)).toHaveValue(vehicles[0].nrPatrimonio);
  expect(screen.getByRole('table', { name: 'Patrimônios por descrição' })).toBeInTheDocument();
});

test('opens a grouped inventory detail route and returns with its filters and unit intact', async () => {
  window.history.replaceState(window.history.state, '', '#/inventory?unit=all&q=Adaptador');
  render(<App />);
  loginAs(/eduardo santos/i);

  const table = screen.getByRole('table', { name: 'Patrimônios por descrição' });
  const row = within(table).getByRole('row', { name: 'Abrir patrimônios de Adaptador storz de engate rápido' });
  fireEvent.click(row);

  await waitFor(() => expect(parseAppRoute(window.location.hash)).toMatchObject({
    page: 'details',
    description: 'Adaptador storz de engate rápido',
    filter: { query: 'Adaptador' },
    unit: null,
    hasUnit: true,
  }));
  expect(screen.getByRole('heading', { name: 'Adaptador storz de engate rápido' })).toBeInTheDocument();

  window.history.back();
  await waitFor(() => expect(parseAppRoute(window.location.hash)).toMatchObject({
    page: 'inventory',
    filter: { query: 'Adaptador' },
    unit: null,
    hasUnit: true,
  }));

  const inventoryTable = screen.getByRole('table', { name: 'Patrimônios por descrição' });
  const inventoryRow = within(inventoryTable).getByRole('row', { name: 'Abrir patrimônios de Adaptador storz de engate rápido' });
  fireEvent.click(inventoryRow);
  await waitFor(() => expect(parseAppRoute(window.location.hash).page).toBe('details'));

  fireEvent.click(screen.getByRole('button', { name: /voltar ao estoque patrimonial/i }));
  expect(parseAppRoute(window.location.hash)).toMatchObject({
    page: 'inventory',
    filter: { query: 'Adaptador' },
    unit: null,
    hasUnit: true,
  });
  expect(screen.getByLabelText(/descrição ou patrimônio/i)).toHaveValue('Adaptador');
});

test('applies the selected unit across the dashboard, inventory and URL', async () => {
  render(<App />);
  loginAs(/eduardo santos/i);

  fireEvent.click(screen.getByRole('button', { name: /abrir navega/i }));
  fireEvent.click(screen.getByRole('button', { name: /selecionar unidade/i }));
  const unitOptions = screen.getByRole('group', { name: 'Unidade global' });
  fireEvent.click(within(unitOptions).getByRole('button', { name: 'Holambra' }));

  await waitFor(() => expect(window.location.hash).toContain('unit=EB+HOLAMBRA'));
  await waitFor(() => expect(screen.getByRole('main')).not.toHaveAttribute('aria-hidden'));
  await openInventory();

  const unitItems = inventorySeed.filter((item) => item.cidade === City.EB_HOLAMBRA);
  const expectedDescriptions = Array.from(new Set(unitItems.map((item) => item.description))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const inventoryTable = screen.getByRole('table', { name: 'Patrimônios por descrição' });
  expect(within(inventoryTable).getAllByRole('row').slice(1).map((row) => row.querySelector('[data-label="Item"]')?.textContent)).toEqual(expectedDescriptions);

  fireEvent.click(screen.getByRole('button', { name: /abrir navega/i }));
  fireEvent.click(screen.getByRole('link', { name: 'Visão geral' }));
  await waitFor(() => expect(screen.getByRole('main')).not.toHaveAttribute('aria-hidden'));

  const activeItems = unitItems.filter((item) => item.status === 'active');
  const stockLabel = screen.getByText('Valor estimado do estoque');
  const displayedStockValue = stockLabel.parentElement?.querySelectorAll('p')[1]?.textContent?.replace(/\u00a0/g, ' ');
  expect(displayedStockValue).toBe(formatCurrency(activeItems.reduce((total, item) => total + item.valor, 0)).replace(/\u00a0/g, ' '));
  const pendingSection = screen.getByText('Itens pendentes de aprovação').closest('section')!;
  const pendingButtons = within(pendingSection).queryAllByRole('button');
  expect(pendingButtons).toHaveLength(unitItems.filter((item) => item.status === 'pending').length);
  pendingButtons.forEach((button) => expect(button).toHaveTextContent('Holambra'));
});


test('almoxarife adds an active exemplar to an approved registration', async () => {
  render(<App />);
  loginAs(/rafael almeida/i);
  fireEvent.click(screen.getByRole('button', { name: /novo item/i }));
  fireEvent.change(screen.getByLabelText(/descrição do item/i), { target: { value: '  VIATURA de Resgate e Salvamento  ' } });
  fireEvent.change(screen.getByLabelText(/número de patrimônio/i), { target: { value: 'EXEMPLAR-APROVADO-001' } });
  fireEvent.change(screen.getByLabelText(/valor unitário/i), { target: { value: '1000' } });
  expect(within(screen.getByLabelText(/descrição do item/i).closest('form')!).getByText('Ativo')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /salvar registro/i }));
  expect(screen.getByText('Novo patrimônio cadastrado como ativo.')).toBeInTheDocument();
  logoutFromSideNav();
  loginAs(/mariana costa/i);
  await openInventory();
  fireEvent.change(screen.getByLabelText(/descrição ou patrimônio/i), { target: { value: 'EXEMPLAR-APROVADO-001' } });
  expect(screen.getByRole('button', { name: /viatura de resgate e salvamento/i })).toBeInTheDocument();
});

test('seed has no pending exemplars for approved registrations', () => {
  const key = (value: string) => value.trim().toLowerCase();
  const approved = new Set(inventorySeed.filter((item) => item.status === 'active').map((item) => key(item.description)));
  expect(inventorySeed.filter((item) => item.status === 'pending' && approved.has(key(item.description)))).toHaveLength(0);
});
