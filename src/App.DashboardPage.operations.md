# Operational document: `DashboardPage`

Implementation: [`App.tsx`](./App.tsx) (`DashboardPage`)

## Purpose and boundary

Present the signed-in user's inventory overview, quick filters, recent history, and administrator review queue. The page coordinates display and navigation; domain rules, reusable tables, and item history storage remain outside the view.

## Contract and data preparation

- The parent supplies the current `user` and `items`, plus navigation, filtering, history, editing, and creation callbacks.
- `visibleItems` is filtered with the existing profile visibility helper. Recent movement rows are flattened from those items' `history` entries, sorted newest first, and limited to six.
- The administrator review queue and metrics use the existing inventory data and role behavior. Production authorization and unit scoping must be enforced by the server.

## Recent movements

- The heading and **Controle de patrimônio** link sit directly above the table. Do not wrap this area in a decorative card, border, shadow, avatar, or image.
- The table is implemented in [`RecentMovementsTable`](./components/inventory/RecentMovementsTable.operations.md), with columns **Item**, **Ação**, **Data**, and **Responsável**.
- An administrator activating a pending item's row opens the edit flow. Other rows open that item's history.
- The event labels and action semantics come from the shared `InventoryHistoryAction` taxonomy; see the table's operational document.

## Other overview content

- Quick-filter metrics navigate to the inventory view with the corresponding existing filter.
- Administrators also see the pending review queue and can open items for review using the current approval controls.
- The page distinguishes the available content by role; do not add new role or permission rules here.

## UI and accessibility

- Use semantic headings and theme text/surface tokens. Keep recent movements in a standard table that scrolls horizontally at narrow widths.
- Table row activation supports pointer, Enter, and Space. The table component owns focus and hover presentation.
- Preserve labels and keyboard access for quick filters, pending items, and navigation actions.

## Dependencies and decisions

The page uses `visibleItemsForRole`, inventory metrics, `RecentMovementsTable`, and callbacks from the parent app. It does not fetch or persist data.

Recent movements are limited to six to keep the overview short. The event vocabulary is explicit in the domain type. Any production audit events beyond that vocabulary (for example, imports, bulk actions, or reactivation) require product review and a corresponding history-schema decision.

## Verification

- Check role-specific content, latest-first ordering, the six-row limit, empty history, and row navigation.
- Check the recent table in light and dark themes, including its hover and keyboard focus states.
- Follow repository quality gates for automated checks; report checks that were not run.
