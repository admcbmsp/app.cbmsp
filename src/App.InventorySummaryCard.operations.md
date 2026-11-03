# Operational document: `InventorySummaryCard`

Implementation: [`App.tsx`](./App.tsx) (`InventorySummaryCard`)

## Purpose and boundary

Show one inventory description's total item count and the nonzero breakdown by item condition in the search summary. The card presents data supplied by `InventoryPage`; it does not filter, calculate, or mutate inventory records.

## Contract and consumer

- The component receives one `InventorySummary` through its `summary` prop: `description`, `type`, `total`, and `stateCounts` keyed by `ItemState`.
- `InventoryPage` creates the summaries from the current filtered inventory and renders one card per description. Its key combines type and description.
- `total` and each state count are formatted with `formatQuantity`. The type and state labels come from the inventory helpers and `stateLabels` map.
- Only states with a count greater than zero are rendered. If there are no nonzero state counts, the condition breakdown is omitted while the card total remains visible.

## UI and responsive behavior

- Use a solid `bg-card` surface, `border-line` outline, and semantic foreground/muted text tokens so the card follows the active light or dark theme.
- Keep the description and type on the left and the total count on the right. Long descriptions may wrap without pushing the count out of view.
- Render condition counts in compact, solid `bg-surface-muted` cells below a divider. The cells use two columns by default and four from the small breakpoint upward.
- Keep the design static and restrained: no gradient, animation, decorative icon, or drop shadow.
- Maintain the surrounding summary section's existing responsive grid; this component does not control the number of cards per row.

## Accessibility

- Use an `article` for each description summary and an `h3` for its description, nested under the page's summary section.
- Represent condition labels and counts as `dt`/`dd` pairs inside a `dl`.
- Keep text readable in both themes using semantic theme tokens rather than fixed light-only colors.

## Dependencies and example

The component uses `InventorySummary`, `ItemState`, `stateLabels`, `formatQuantity`, and `getTypeLabel` from the existing application types and utilities. It has no service calls or internal state.

Example input:

```ts
{
  description: 'Viatura de Resgate e Salvamento',
  type: 'vehicle',
  total: 4,
  stateCounts: { novo: 1, bom: 3, regular: 0 },
}
```

## Decisions and rationale

- Keep the summary calculation in `InventoryPage`; the card only formats and presents the provided values, so the same filtering rules remain owned by the view.
- Use theme tokens for every surface, border, and text color to avoid white or slate colors becoming low contrast in dark mode.
- Omit zero-count condition cells to keep the summary concise, matching the prior behavior.

## Verification

- Review a summary card in light and dark modes, with short and long descriptions, with one or several nonzero conditions, and with no nonzero conditions.
- Confirm the total remains visible when the condition breakdown is empty and that the card wraps cleanly at narrow widths.
- Follow repository quality gates for automated checks and report any checks not run.
