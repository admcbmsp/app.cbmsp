# Operational document: `InventoryPage`

Implementation: [`App.tsx`](./App.tsx) (`InventoryPage`)

## Purpose and boundaries

Let a signed-in user search and filter visible assets, view grouped totals or individual items, configure table columns, request a summary, export the current view, and start permitted item actions. The page coordinates presentation and view state; inventory rules and reusable controls remain in the domain/services and shared components.

## Requirements and consumers

- Product requirements: CR-03 (lookup and summary), CR-05–CR-09 (item actions and reports), CR-14 (saved lookup templates), CR-15 (configurable tables), CR-17 (unit scope), and CR-18 (operational documentation).
- The parent app supplies the authenticated user, already visible items, selected unit, initial filters, and callbacks for edits, history, approvals, creation, export, filter URL synchronization, and notifications.
- Role filtering and unit filtering are currently applied before or during the page's data preparation. Production authorization and unit scope must also be enforced by the server.

## Layout and behavior

- Page-level actions are placed beside **Modelos** and **Novo item**: **Exportar PDF**, templates, and item creation (when permitted). Export uses the grouped report in grouped view and the selected description's individual items in detail view. It is disabled when the displayed view has no records.
- Search and filter controls sit directly on the page without a surrounding card and wrap on compact screens. In grouped view, the **Colunas** control sits with the filters; **Limpar**, when available, is last on the right. In individual-item detail view, the filters are hidden and the **Colunas** control sits beside the results heading.
- The grouped table defaults to the required **Item** column plus **Total** and **Operacional**. Other status-breakdown columns remain available through **Colunas** but start hidden. Grouped and individual column selections are controlled by `visibleGroupColumns` and `visibleColumns`; both configurations are captured in, restored from, and updated in templates.
- Table data columns default to centered alignment; the long **Item** and **Descrição do cadastro** columns explicitly use logical `start` alignment. Other columns can override alignment through their column definitions.
- Each table paginates at 10 rows by default, with choices of 10, 25, or 50. The footer counts visible table rows, so it counts descriptions in grouped view and individual assets in detail view. The **Bens cadastrados** subtitle keeps the grouped description and matching asset counts; the separate filter-card count/profile row is removed because the role appears in the application shell and the table now has its own row range.
- The **Fazer resumo** action remains visible on the right side of the **Bens cadastrados** header row, replacing the **Dados locais** indicator. It is disabled when there is no active search/filter and enabled when there is a criterion active, even if there are no matches. Opening it with no matches shows an empty-summary message; with matches, it shows the existing summary cards. Filter changes and template application close the summary.
- Each summary card presents one description's total and nonzero condition counts; its visual and data contract are documented in [`InventorySummaryCard`](./App.InventorySummaryCard.operations.md).
- The **Bens cadastrados** heading and summary action sit above and outside the bordered table. The table border encloses only the table; pagination is a separate, unboxed footer below it. The compact-layout sort controls remain immediately above the table when table headers are visually hidden.
- Clearing filters resets the query and filter selections and updates the URL through the existing filter handler.
- Selecting a grouped row opens its individual items. Row action menus and available detail actions depend on the user's role.

## UI and accessibility

- Keep the export/templates/create actions together in the page heading area and allow them to wrap on narrow widths.
- Keep search and filters unboxed. Place the grouped table's column control with the filters and **Limpar** last on the right. Place the individual table's column control beside its results heading.
- Keep the results heading outside the bordered table and the pagination controls in a separate unboxed row below the table.
- The summary action uses `aria-pressed`; the summary region uses a label and live announcement. Preserve these semantics when adjusting the heading row.
- Search and filters must retain labels, keyboard access, visible focus, and the responsive behavior required by CR-10.

## Data and service dependencies

- The view currently derives matching items, groups, totals, and summary cards from the `items` prop and local filter state.
- Search/filter changes synchronize through `onFilterChange`; templates use `InventoryViewTemplates` and the saved-view service. Applying a template restores filters and both table column configurations.
- PDF output uses `openPrintReport` for grouped data and the parent's export callback for individual detail data.
- No view-level data persistence is performed here; template persistence is owned by its template service/adapter.

## Decisions and rationale

- Keep PDF export in the page-level action row so it is easy to find and remains available in both grouped and individual-item views.
- Keep column configuration beside the filters for grouped lookup because it changes the presentation of those filtered results. The picker remains owned by `DynamicDataTable` and is placed through `columnControlTarget`; this avoids duplicating picker behavior.
- Keep the summary action visible to make its availability discoverable; disable it until a search/filter is active. Do not disable it solely because there are no matches; show a useful empty state instead.
- Replace the **Dados locais** indicator with the summary action in the grouped results header, as requested. The indicator is not needed in that position.

## Verification

- Check grouped and individual views, filtered and unfiltered states, and search/filter states with and without matching records.
- Check the location and wrapping of page actions and the column control at compact widths and desktop widths.
- Confirm that grouped and individual PDF export still use the corresponding visible records and that summary changes do not alter filter or URL state.
- Follow repository quality gates for test/build commands; report checks that were not run.
