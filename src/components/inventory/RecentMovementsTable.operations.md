# Operational document: `RecentMovementsTable`

Implementation: [`RecentMovementsTable.tsx`](./RecentMovementsTable.tsx)

## Purpose and boundary

Render recent inventory history events as compact cards below 1280 px and as a table at wider sizes. The component receives already-filtered, already-sorted movement rows and only presents them. It does not fetch history, decide which records a user may see, or define authorization rules.

## Contract and consumer

- `movements` is an ordered list of `{ item, entry }` pairs, where `item` is the related `InventoryItem` and `entry` is an `InventoryHistoryEntry`.
- `onActivate` is called when a row is clicked or activated with Enter or Space.
- `DashboardPage` supplies at most six events, sorted newest first, from the inventory records visible to the current profile.
- Each row displays the item description and asset number, the action category and its summary, the event date, and the responsible user's recorded name.

## Action taxonomy

The table uses the shared `InventoryHistoryAction` vocabulary and labels:

| Action key | Display label | Current meaning |
|---|---|---|
| `created` | Cadastro | A new item was registered. |
| `edited` | Edição de dados | Non-status item fields were changed; the summary describes specific changes when available. |
| `administrativeStatusChanged` | Status administrativo alterado | An administrator directly changed the administrative status outside the approve, reject, or deactivate actions. |
| `approved` | Aprovação | A pending item was approved. |
| `rejected` | Rejeição | A pending item was rejected. |
| `moved` | Transferência | The item's city/unit changed. |
| `deactivated` | Desativação | The item was deactivated. |

Condition and operational-status changes remain `edited` events and their summaries identify the before and after values. If a save changes the city/unit and administrative status together, the action category follows the administrative-status action and the summary includes both changes.

## Behavior and states

- Cards are native buttons; desktop rows activate on pointer click, Enter, or Space.
- `DashboardPage` opens the edit flow for a pending item when the current user is an administrator; otherwise it opens that item's history.
- When there are no events, both layouts show **Nenhuma movimentação registrada.**
- The component does not paginate; the dashboard limits the list to six rows.

## UI and accessibility

- Below 1280 px, show labeled, keyboard-accessible cards. Each card includes the item and asset number, action and summary, event date, and responsible user.
- At 1280 px and wider, compose the shared [`DynamicDataTable`](../DynamicDataTable.operations.md) with fixed columns **Item**, **Ação**, **Data**, and **Responsável**. The action cell also includes the event summary.
- Keep the desktop table directly on the page, without a decorative card, shadow, avatar, or image. Preserve its horizontal scrolling, row hover, and focus behavior.
- Use `<time dateTime>` with the source timestamp and a readable localized date in both layouts.

## Dependencies and side effects

Uses `InventoryItem`, `InventoryHistoryEntry`, the shared action labels, `formatDateTime`, and `DynamicDataTable`. It has no state, persistence, or service calls.

## Decisions and rationale

- Keep the recent activity column definitions and row-to-history activation in this small adapter while delegating table rendering and common interactions to `DynamicDataTable`.
- Use a distinct `administrativeStatusChanged` event so direct administrative-status edits are recognizable in the action column. Approval, rejection, deactivation, and unit transfer remain separate event categories.
- Keep condition and operational-status changes under the general edit category while including their before/after values in the summary. Splitting those into additional action types is an open product decision for the production audit model.

## Verification

- Check all action labels, summaries, timestamps, and responsible names in light and dark themes.
- Check card and table activation, Enter and Space behavior, the empty state, and the 1280 px responsive switch.
- Follow repository quality gates for automated checks; report checks that were not run.
