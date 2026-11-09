# Operational document: `RejectItemDialog`

Implementation: [`App.tsx`](./App.tsx) (`RejectItemDialog`)

## Purpose and boundary

Collect a required reason when an administrator rejects an individual pending patrimony from the inventory action menu. The parent owns the selected item, API operation, local status update, and history entry.

## Behavior and validation

- The dialog identifies the item by description and patrimony number.
- **Motivo da rejeição** is required, trimmed before submission, and limited to 281 characters.
- Empty or overlong reasons do not call the API. The dialog remains open and preserves the user's input after an API error.
- The destructive **Confirmar rejeição** action remains loading while the request is in progress; cancellation and dismissal are disabled during submission.

## API and data effects

- Calls `POST /api/v1/items/{id}/reject` with JSON `{ "reason": "..." }` through `src/services/inventoryApi.ts`.
- The API base URL is `REACT_APP_API_BASE_URL`; when unset, the service uses the current origin. Requests include browser credentials and do not send user identity fields.
- Only after a successful response does the parent mark the selected item rejected and append the reason to its local history as `reason` and `MOTIVO DA REJEIÇÃO: ...`.

## Verification

- Check required and max-length validation, API request identity and body, successful local status/history updates, and API failures that leave the item pending.
