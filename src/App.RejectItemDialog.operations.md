# Operational document: `RejectItemDialog`

Implementation: [`App.tsx`](./App.tsx) (`RejectItemDialog`)

## Purpose and boundary

Collect a required reason when an administrator rejects an individual pending patrimony from the inventory action menu. The parent owns the selected item, local status update, and history entry.

## Behavior and validation

- The dialog identifies the item by description and patrimony number.
- **Motivo da rejeição** is required, trimmed before submission, and limited to 281 characters.
- Empty or overlong reasons cannot be submitted; the dialog preserves the user's input until it is corrected or dismissed.

## Data effects

- The parent marks only the selected item as rejected and appends the reason to its in-memory history as `reason` and `MOTIVO DA REJEIÇÃO: ...`.
- The prototype does not call a backend or persist the change after the browser session.

## Verification

- Check required and max-length validation, and confirm only the selected item and its local history change.
