# Operational document: `ListPaginationFooter`

Implementation: [`ListPaginationFooter.tsx`](./ListPaginationFooter.tsx)

## Purpose and boundaries

Provide the shared pagination footer for a list or table. It displays the page-size control, the visible result range, and previous/next navigation. It does not slice data; the consumer owns the current page and page size and applies them to its data.

## Public contract

- `ariaLabel`, `page`, `pageSize`, `totalItems`, `onPageChange`, and `onPageSizeChange` are required.
- `pageSize` is one of `10`, `25`, or `50`. The consumer should initialize its page size to 10 and reset to page 1 when the data set or page size changes.
- `totalItems` represents the exact number of rows available to paginate, after filtering and sorting.
- The component clamps its displayed page to a valid value but does not silently update an invalid `page` prop; the consumer remains responsible for state.

## Behavior and states

- Page count is at least one, including when there are no results.
- The displayed range is `0–0` when empty; otherwise it reports the first and last row on the current page and total rows.
- Previous and next controls are disabled at their respective boundaries.
- Changing page size is delegated to `onPageSizeChange`; `ListPaginationFooter` does not own or persist the selection.

## UI and accessibility

- The footer is unboxed and visually detached from the table, with a small gap above it. It adapts from a stacked layout on narrow screens to a horizontal layout on wider screens.
- The page-size select has a visible label. Result-range changes are announced politely. Previous and next icon buttons have accessible names.
- Use theme text, focus, and disabled tokens/classes. Keep the footer visually separate from the table border.

## Decisions and rationale

- Use a compact previous/next pager plus a page indicator and range. This keeps navigation understandable without taking space for many numbered-page buttons.
- Offer exactly 10, 25, and 50 rows per page as requested. Page size is table state and is not added to saved lookup templates.
- The named `troi-list-pagination-footer` reference was not present in this workspace, so this component follows its described list-footer role with the project's existing components and tokens.

## Verification

- Check empty results, one-page results, first and last pages, page-size changes, and screen-reader labels.
- Confirm the parent slices sorted rows before rendering and resets to page 1 when the data set changes.
- Follow repository quality gates for test/build commands; report checks that were not run.
