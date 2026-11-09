# Operational document: `Dialog`

Implementation: [`Dialog.tsx`](./Dialog.tsx)

## Purpose and boundary

Provide the shared modal shell and lifecycle interactions for application dialogs. A consumer supplies the open state, title, optional caption, content, and up to two actions. The shell owns presentation, dismissal requests, focus handling, and page scroll locking; the consumer owns form data, validation, business rules, and whether an action succeeded.

## Public contract

- `open` is the source-of-truth visibility state. The consumer supplies `onOpenChange`; the dialog calls it with `false` when the user requests dismissal.
- `title` is required. The shell renders it as an `h2` and uses an internally generated ID for `aria-labelledby`.
- `caption` is optional and rendered directly below the title. When present, it is connected through `aria-describedby`.
- `children` is required and may contain arbitrary content, including a form.
- `actions` is optional and accepts one or two actions. Each action has a label and one of `primary`, `secondary`, or `destructive`; it may also specify native button `type`, `form`, `disabled`, `loading`, and `onClick` properties.
- `closeLabel` is optional and defaults to **Fechar diálogo**. `size` is `sm`, `md`, or `lg`, defaulting to `md`.
- Action buttons do not close the dialog automatically. The consumer closes only after the action's own validation or asynchronous work succeeds.

## Behavior and states

- When `open` is false, the dialog renders nothing and has no active side effects.
- Clicking the backdrop, pressing Escape, or activating the close button requests `onOpenChange(false)`.
- While open, focus moves to the first focusable element (or the panel if none exists), Tab and Shift+Tab remain inside, and closing restores focus to the element active before opening when it is still connected.
- While open, body scrolling is locked and restored when the dialog closes or unmounts.
- The panel body scrolls independently from its header and action footer.
- Below 640 px, the full-width panel is anchored to the bottom and slides upward when opened. At 640 px and wider, it remains a centered modal. Reduced-motion preferences disable the mobile entrance animation.
- The dialog is portaled to `document.body` to avoid clipping and stacking contexts in consumers.

## UI and accessibility

- Every dialog has a visible title and close button. The caption is placed under the title when provided.
- The optional action footer supports at most two controls. Supplied order is preserved left-to-right on wide layouts and the primary edge action appears first in the stacked mobile layout when the consumer supplies secondary then primary.
- `secondary` uses a theme surface, `primary` uses the primary button style, and `destructive` uses the semantic error colors.
- The panel uses `role="dialog"`, `aria-modal`, a labelled title, and an optional description. The close icon has an accessible label.
- The backdrop is dismissible by pointer and uses the shared `.application-backdrop` theme effect. Escape and focus trapping are handled at the document level while the dialog is open.

## Example

```tsx
<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Cadastrar item"
  caption="Informe os dados do patrimônio."
  actions={[
    { label: 'Cancelar', variant: 'secondary', onClick: () => setIsOpen(false) },
    { label: 'Salvar', variant: 'primary', type: 'submit', form: 'item-form' },
  ]}
>
  <form id="item-form" onSubmit={handleSubmit}>{/* fields */}</form>
</Dialog>
```

## Decisions and rationale

- Keep `open` controlled by the consumer so the dialog's visibility cannot drift from selected-record or modal state. The dialog centralizes dismissal and focus behavior but does not own form state.
- Keep a fixed header/body/footer shell rather than exposing independently composable subcomponents. This guarantees the required title and close control and keeps each consumer's layout consistent.
- Use an action tuple to constrain consumers to at most two buttons. The footer action never auto-dismisses because saves and exports may validate, fail, or complete asynchronously.
- Direct administrative or destructive actions use `destructive` styling; the variant alone does not decide confirmation policy.
- The current application renders one modal at a time. Nested-dialog stacking behavior remains outside this component contract.

## Verification

- Check controlled open/close, backdrop dismissal, Escape, close-button dismissal, focus trapping/restoration, and body scroll restoration.
- Check title-only and title-plus-caption variants, no actions, one action, and two actions; check primary, secondary, and destructive styles in both themes.
- Check a form whose submit action is in the footer, validation failure, disabled/loading actions, and a tall scrollable panel.
- Follow repository quality gates for automated checks; report checks that were not run.
