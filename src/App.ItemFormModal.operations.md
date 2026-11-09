# Operational document: `ItemFormModal`

Implementation: [`App.tsx`](./App.tsx) (`ItemFormModal`)

## Purpose and boundary

Collect values for creating or editing one inventory item. The component owns local field state and form validation. The parent owns whether the modal is mounted, the user/session rules, and the resulting inventory mutation/history event.

## Contract and consumer

- The parent supplies the available items, optional item being edited, current role, default city/unit, `onClose`, and `onSubmit` callback.
- The dialog opens when the parent renders this component. Any shell dismissal calls `onClose`.
- `onSubmit` receives the validated `InventoryFormValues` and the trimmed rejection reason. The parent updates the prototype's in-memory item state and closes the modal after submission.

## Dialog structure

- The shared [`Dialog`](./components/Dialog.operations.md) supplies the visible title (**Cadastrar novo item** or **Editar registro**), the optional role-specific caption, close button, scrolling content region, and action footer.
- The footer has **Cancelar** (`secondary`) and **Salvar registro** (`primary`). The save action submits the `item-form` element even though the action button lives outside the form markup.
- Saving does not close the dialog from inside the shell; the parent closes it after processing the submitted values.

## Behavior and validation

- Description, asset number, city/unit, and a positive estimated value are required by the current prototype form.
- A city/unit must be selected from the available suggestions.
- A non-administrator editing an item can change condition, operational status, and city/unit. Administrative status and administrative fields remain owned by the existing role logic.
- When an administrator changes an item to **Rejeitado**, the form reveals the required **Motivo da rejeição** field. The reason is trimmed and limited to 281 characters before submission.
- A valid rejection updates the item's status and appends the reason to its local history. The change exists only for the current browser session.
- Form errors are announced with `role="alert"`. Current values remain visible when validation fails.

## Data and side effects

Uses `InventoryFormValues`, status/condition/type labels, city options, `TextAreaField`, and the parent's submit callback. On submit it trims description, asset number, and rejection reason and forwards the values. All changes remain in session memory.

## Decisions and rationale

- Keep form state and validation inside the form component while standardizing the dialog shell and footer actions through `Dialog`.
- Use the native form submit path for the footer's save action so Enter key submission and button submission use the same validation handler.

## Verification

- Check create and edit titles/captions, role-specific fields, required-field errors, invalid city selection, positive-value validation, Enter submission, cancel, and close button.
- Check the form body scrolls while the dialog header and action footer remain visible.
- Follow repository quality gates for automated checks; report checks that were not run.
