import { fireEvent, render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';

test('uses a bottom drawer on mobile and keeps the supplied dialog content', () => {
  const onOpenChange = jest.fn();
  render(
    <Dialog
      open
      onOpenChange={onOpenChange}
      title="Cadastrar item"
      caption="Informe os dados do patrimônio."
      size="md"
    >
      <p>Conteúdo do formulário</p>
    </Dialog>,
  );

  const dialog = screen.getByRole('dialog', { name: 'Cadastrar item' });
  const overlay = dialog.parentElement;

  expect(overlay).toHaveClass('items-end', 'p-0', 'sm:items-center', 'sm:p-6');
  expect(dialog).toHaveClass('dialog-panel', 'w-full', 'max-w-none', 'rounded-t-md', 'sm:rounded-md', 'sm:max-w-xl');
  expect(screen.getByText('Informe os dados do patrimônio.')).toBeInTheDocument();
  expect(screen.getByText('Conteúdo do formulário')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Fechar diálogo' }));
  expect(onOpenChange).toHaveBeenCalledWith(false);
});
