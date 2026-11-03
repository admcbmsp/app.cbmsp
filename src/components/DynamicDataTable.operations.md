# Operational document: `DynamicDataTable`

Implementation: [`DynamicDataTable.tsx`](./DynamicDataTable.tsx)

## Purpose and boundaries

Render a generic table from consumer-supplied rows and cell renderers. Optional capabilities add column configuration, sorting, pagination, row activation, and per-row action menus. The component owns enabled table interactions; consumers own the data and business rules.

## Public contract

- `ariaLabel`, `rows`, `columns`, and `getRowKey` are required.
- `visibleColumnKeys`, `defaultColumnKeys`, and `onVisibleColumnKeysChange` are optional. Supply all three to enable the column picker; when omitted, all columns are shown in their declared order.
- `getActions` is optional. Supplying it adds the final actions column and its per-row menu.
- `onRowClick`, `getRowLabel`, `getActionMenuLabel`, `actionLabel`, `columnControlTarget`, `pagination`, and `emptyState` are optional.
- Columns provide a stable key, display label, and cell renderer; `sortValue` enables sorting, `locked` prevents hiding, `numeric` enables tabular numerals, and optional `align` sets the horizontal alignment of both the header and body cell.
- `align` accepts `start`, `center`, or `end` and defaults to `center`. Use logical alignment so start/end follow writing direction. `actionAlign` controls the actions header/body cells and also defaults to `center`.
- Example: set `align: 'start'` on a long description column; leave counts and status columns unset to use the centered default.
- The column visibility list is controlled by the consumer when the picker is enabled. The component reports changes through `onVisibleColumnKeysChange` and does not persist them itself.
- `pagination` defaults to `true`. Set it to `false` to render all rows without a page-size control or footer. `emptyState` supplies optional content for a zero-row table.
- `columnControlTarget` controls where the column picker is rendered: omitted (`undefined`) means render it as a standalone control before the table; an `HTMLDivElement` renders it into that host with a React portal; `null` means an external host is expected but not ready, so the picker is temporarily not rendered. A consumer using an external host must keep it mounted while the table needs the control.

## Behavior and states

- Locked columns are always included and cannot be unchecked. The consumer should include required columns in the `columns` definition with `locked: true`.
- The picker can show/hide optional columns, move visible columns up or down, restore defaults, and close with **Concluir**.
- Clicking outside the picker closes it. Escape closes it and returns focus to the picker trigger.
- Activating a sortable table heading cycles ascending, descending, then unsorted. On compact layouts, the sort select and direction control provide the equivalent interaction.
- Rows are sorted before pagination. The table starts at 10 rows per page and offers 10, 25, and 50. Changing the source rows or page size returns to page 1; page navigation is bounded by the current result count.
- The footer's range and page count describe table rows (descriptions in grouped view, individual assets in detail view), not the underlying asset totals.
- A row can be activated with Enter or Space when `onRowClick` is supplied; interactive controls inside the row do not trigger row activation.
- Per-row actions appear only when `getActions` is supplied; permission checks and business rules must be applied by the consumer and, in production, by the server.

## UI and accessibility

- At compact widths, the table retains its headings and rows and scrolls horizontally inside its bordered wrapper. The table uses its content-driven width with a 100% minimum, so columns stay wide enough for their content. When any visible column is sortable, the labeled sort control is available above it.
- The table border encloses only the horizontally scrollable table. The results heading and any consumer-placed column control remain outside it; the default column control is rendered as a simple standalone control before the table, without a padded toolbar or sort instruction.
- When pagination is enabled, its footer follows the table as an unboxed row with a small gap. It is visually detached from the table border.
- Apply each column's alignment consistently to its header and body cell. Keep column content and headings aligned while the table scrolls.
- Keep row dividers and the theme border around the scroll container consistent at all widths. The actions column becomes sticky only at wide breakpoints so it does not cover content while narrow tables scroll.
- Row hover changes the row background to the muted-surface token; cell text keeps its normal foreground or muted color. The sticky actions cell follows the same background state. Consumer cell renderers should not add row-hover text color changes.
- When pagination is enabled, expose the page-size select, result range, current page, and previous/next controls with accessible names.
- Keep control labels, focus treatment, required-column indication, and action-menu accessible names clear. Preserve keyboard operation when changing the picker placement.
- The picker menu is positioned relative to its own trigger. If it is portaled, the consumer-provided host determines its placement in the surrounding layout.

## Data, services, and side effects

- The component is presentation-only. It does not fetch, filter, export, or persist data.
- `renderCell`, `sortValue`, row key functions, and action callbacks are consumer-provided.
- Sorting uses the supplied sort values and Brazilian Portuguese locale comparison for text values.

## Placement decision and rationale

The grouped asset lookup places its column control beside the filters, while the individual-item view places it beside the results heading. `columnControlTarget` lets `DynamicDataTable` retain ownership of picker state and behavior while rendering the same control in a consumer-selected host. The dashboard's recent-movements table uses this component with fixed columns, row activation, no action menu, and pagination disabled.

Keep optional capabilities disabled when a consumer needs a simple fixed table. This lets data tables share rendering, responsive scrolling, row interaction, and theme styling without showing controls that do not fit the view.

## Verification

- Existing focused test file: [`DynamicDataTable.test.tsx`](./DynamicDataTable.test.tsx).
- Check column visibility, locked columns, ordering, sorting, row keyboard activation, outside-click/Escape dismissal, and both default and external picker placement when changing this contract.
- Follow repository quality gates for test/build commands; report checks that were not run.
