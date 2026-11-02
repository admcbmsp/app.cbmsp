import { AppUser } from '../types/inventory';

export const demoPassword = '123456';

export const demoUsers: AppUser[] = [
  {
    id: 'usr-reader-001',
    name: 'Mariana Costa',
    email: 'reader@cbmsp.test',
    role: 'reader',
  },
  {
    id: 'usr-almox-001',
    name: 'Rafael Almeida',
    email: 'almoxarife@cbmsp.test',
    role: 'almoxarife',
  },
  {
    id: 'usr-adm-001',
    name: 'Cap. Eduardo Santos',
    email: 'adm@cbmsp.test',
    role: 'adm',
  },
];
