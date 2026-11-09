import { MAX_REJECTION_REASON_LENGTH, rejectInventoryItem } from './inventoryApi';

const fetchMock = jest.fn();
const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');

beforeEach(() => {
  fetchMock.mockReset();
  Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: fetchMock });
});

afterEach(() => {
  if (originalFetchDescriptor) {
    Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
  } else {
    delete (globalThis as { fetch?: typeof fetch }).fetch;
  }
});

test('rejects one item with the specified reason and authenticated session', async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    headers: { get: () => 'application/json' },
  } as unknown as Response);

  await rejectInventoryItem('asset/id-1', '  Patrimônio duplicado.  ');

  expect(fetchMock).toHaveBeenCalledWith('/api/v1/items/asset%2Fid-1/reject', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Patrimônio duplicado.' }),
  });
});

test('does not send an empty or overlong rejection reason', async () => {
  await expect(rejectInventoryItem('item-1', '   ')).rejects.toThrow('Informe o motivo da rejeição.');
  await expect(rejectInventoryItem('item-1', 'x'.repeat(MAX_REJECTION_REASON_LENGTH + 1))).rejects.toThrow('no máximo 281');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('surfaces API rejection errors', async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    headers: { get: () => 'application/json' },
    json: async () => ({ message: 'O item não está pendente.' }),
  } as unknown as Response);

  await expect(rejectInventoryItem('item-1', 'Motivo')).rejects.toThrow('O item não está pendente.');
});
