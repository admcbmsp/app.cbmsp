# Operational document: `ExportFormatModal`

Implementation: [`App.tsx`](./App.tsx) (`ExportFormatModal`)

## Purpose and boundary

Let a signed-in user choose CSV or PDF for the current full inventory scope. The parent supplies the allowed record count and performs the selected export.

## Contract and consumer

- `itemCount` is the number of records available for the current role and unit scope.
- `onExport` receives `csv` or `pdf`; the parent owns export generation, errors, and closing the modal after the operation.
- The parent mounts this component only while the export-format choice is open.

## Dialog structure and behavior

- The shared [`Dialog`](./components/Dialog.operations.md) supplies the title **Escolha o formato**, a caption with the permitted record count, and the close button.
- The content explains the action. Footer actions are **Exportar CSV** (`secondary`) and **Exportar PDF** (`primary`).
- Backdrop, Escape, and the close button call `onClose`. Export buttons call `onExport`; they do not receive automatic close behavior from the dialog shell.

## Dependencies and decisions

This component depends on the shared dialog shell and the parent's export callback. It does not construct files or determine record permissions. Keep format selection in the standardized action footer so format choices follow the same dialog layout as form actions.

## Verification

- Check the displayed count, both format callbacks, close button, backdrop dismissal, Escape, and the action order at narrow and wide sizes.
- Follow repository quality gates for automated checks; report checks that were not run.
