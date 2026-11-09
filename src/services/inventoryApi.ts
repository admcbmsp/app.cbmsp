const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL ?? '').replace(/\/+$/, '');

export const MAX_REJECTION_REASON_LENGTH = 281;

export async function rejectInventoryItem(itemId: string, reason: string): Promise<void> {
  const normalizedReason = reason.trim();
  if (!normalizedReason) {
    throw new Error('Informe o motivo da rejeição.');
  }
  if (normalizedReason.length > MAX_REJECTION_REASON_LENGTH) {
    throw new Error(`O motivo da rejeição deve ter no máximo ${MAX_REJECTION_REASON_LENGTH} caracteres.`);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/v1/items/${encodeURIComponent(itemId)}/reject`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: normalizedReason }),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }

  if (!response.ok) {
    let message = 'Não foi possível rejeitar o patrimônio. Tente novamente.';
    try {
      const payload: unknown = await response.json();
      if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
        message = payload.message;
      }
    } catch {
      // Keep a safe, user-facing fallback when the API response is not JSON.
    }
    throw new Error(message);
  }

  // Detect the Create React App development-server fallback for unknown API paths.
  if (response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('A API de patrimônio não está disponível neste endereço.');
  }
}
