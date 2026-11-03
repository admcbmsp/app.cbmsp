# Operational document: `InventoryViewTemplates`

Implementation: [`InventoryViewTemplates.tsx`](./InventoryViewTemplates.tsx)

## Purpose and boundaries

Let a user save, apply, update, rename, delete, and choose a default for their lookup configuration. The component owns template-management UI and calls the saved-view repository. The inventory page owns the current filters and grouped/individual column selections; this component receives and returns those values through props.

## Public contract

- `userId`, `autoApplyDefaultOnEntry`, `filters`, `columns`, `groupColumns`, `onApply`, and `onToast` are required.
- `columns` contains the individual-item table's ordered column keys; `groupColumns` contains the grouped table's ordered column keys.
- `onApply` receives the saved filters, individual columns, and grouped columns. Consumers must restore all three values and synchronize filters to the web URL as required.
- Templates belong to one user and store configuration only. They must not store inventory records or credentials.

## Behavior and states

- Saving captures the current filters and both table column configurations. Updating a template refreshes those same values while preserving its name and identity.
- Applying a template restores both table configurations and filters, then makes that template the user's default under the current behavior.
- The first saved template becomes the default when no valid default exists. The UI also offers an explicit **Definir padrão** action.
- The local repository uses schema version 2. Existing version 1 templates are migrated on read: existing filters and individual columns are preserved, grouped columns are initialized from the new default, and the migrated record is written under the version 2 storage key. The old record is not deleted by this migration.
- Loading, local-storage failure, empty list, save, rename, update, delete confirmation, and action-in-progress states are represented in the UI.

## UI and accessibility

- The **Modelos** trigger opens a dialog-style panel. Escape closes it and returns focus to the trigger; clicking outside closes the panel.
- The save and rename fields have labels and validation feedback. Destructive deletion requires an inline confirmation.
- The saved-template summary shows counts for grouped and individual columns separately.

## Data and service dependencies

- Uses `createSavedInventoryViewRepository` with browser `localStorage` through the `KeyValueStorage` interface.
- Saved fields are template name, versioned filters, ordered individual and grouped column keys, and timestamps. The default template ID is stored separately per user.
- `savedInventoryViews.ts` validates/sanitizes persisted keys and migrates the previous schema.

## Decisions and rationale

- Store grouped and individual table configurations separately because each table has a different set of valid columns and can be customized independently.
- Keep grouped **Item** required, with **Total** and **Operacional** as defaults. Additional status breakdowns remain available and can be persisted in a template.
- Bump the template schema to version 2 so saved grouped-column keys have an explicit version boundary. Migrate existing local data instead of discarding users' saved filters and individual-column settings.

## Verification

- Check create, apply, update, rename, delete, and default-template flows with both column configurations.
- Confirm a version 1 stored template is migrated with its filters and individual columns intact and the new grouped defaults applied.
- Check that a version 2 template restores custom grouped columns in their saved order.
- Follow repository quality gates for test/build commands; report checks that were not run.
