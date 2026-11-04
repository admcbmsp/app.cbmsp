import { render, screen } from '@testing-library/react';
import type { AppUser } from '../types/inventory';
import { ProfilePage } from './ProfilePage';

const user: AppUser = {
  id: 'test-user',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  role: 'reader',
  patente: '',
  unidade: '',
  telefoneContato: '',
};

test('lets the profile form fill the space below its heading', () => {
  render(<ProfilePage user={user} onSave={jest.fn()} />);

  const section = screen.getByRole('region', { name: 'Meu perfil' });
  const form = screen.getByRole('button', { name: 'Salvar perfil' }).closest('form');

  expect(section).toHaveClass('application-page');
  expect(form).toHaveClass('application-page-form');
  expect(form?.lastElementChild).toHaveClass('application-page-actions');
});
