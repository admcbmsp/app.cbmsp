# Operational document: `EditUserRoleModal`

Implementation: [`EditUserRoleModal.tsx`](./EditUserRoleModal.tsx)

## Purpose and boundary

Edit one user's access role. This component owns the selected role in its form state. The parent supplies the user and owns authorization, persistence/session changes, and whether the modal is mounted.

## Contract and consumer

- `user` supplies the account whose role is being edited.
- `onSave` receives the user's ID and selected `UserRole`; `onClose` handles dismissal.
- The parent mounts the component only for an administrator with a selected user.

## Dialog structure and behavior

- The shared [`Dialog`](../Dialog.operations.md) supplies the required title **Editar perfil**, caption, close button, and action footer.
- **Cancelar** is a `secondary` action. **Salvar perfil** is a `primary` form-submit action attached to `edit-user-role-form`.
- The form displays the user's name/email and an access-role selector. Submission calls `onSave`; the parent decides success and closes the dialog.

## Dependencies and decisions

Uses the shared `Dialog`, `SelectField`, `roleLabels`, and `userRoles`. Keep access checks in the parent and backend; the dialog is a form and does not authorize role changes.

## Verification

- Check current-role initialization, role changes, submit, cancel, close button, backdrop dismissal, Escape, and focus return.
- Follow repository quality gates for automated checks; report checks that were not run.
