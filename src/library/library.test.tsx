import { fireEvent, render, screen } from '@testing-library/react';
import { Button, InputField, LinkButton, Switch } from './index';

test('renders button variants, loading state and navigation link', () => {
  render(
    <>
      <Button variant="danger">Desativar</Button>
      <Button loading>Salvar</Button>
      <LinkButton href="/estoque">Estoque</LinkButton>
    </>,
  );

  expect(screen.getByRole('button', { name: 'Desativar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  expect(screen.getByRole('link', { name: 'Estoque' })).toHaveAttribute('href', '/estoque');
});

test('renders field metadata and propagates switch changes', () => {
  const onCheckedChange = jest.fn();

  render(
    <>
      <InputField label="Descrição" error="Campo obrigatório" />
      <Switch checked={false} onCheckedChange={onCheckedChange} label="Receber alertas" />
    </>,
  );

  expect(screen.getByLabelText('Descrição')).toHaveAttribute('aria-invalid', 'true');
  expect(screen.getByRole('alert')).toHaveTextContent('Campo obrigatório');

  fireEvent.click(screen.getByRole('switch'));
  expect(onCheckedChange).toHaveBeenCalledWith(true);
});
