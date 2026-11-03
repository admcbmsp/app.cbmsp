import { AppUser } from '../types/inventory';

export const demoPassword = '123456';

export const demoUsers: AppUser[] = [
  {
    id: 'usr-reader-001',
    name: 'Mariana Costa',
    firstName: 'Mariana',
    lastName: 'Costa',
    email: 'reader@cbmsp.test',
    role: 'reader',
    patente: '',
    unidade: '',
    telefoneContato: '',
  },
  {
    id: 'usr-almox-001',
    name: 'Rafael Almeida',
    firstName: 'Rafael',
    lastName: 'Almeida',
    email: 'almoxarife@cbmsp.test',
    role: 'almoxarife',
    patente: '',
    unidade: '',
    telefoneContato: '',
  },
  {
    id: 'usr-adm-001',
    name: 'Cap. Eduardo Santos',
    firstName: 'Eduardo',
    lastName: 'Santos',
    email: 'adm@cbmsp.test',
    role: 'adm',
    patente: 'Cap.',
    unidade: '',
    telefoneContato: '',
  },
];
