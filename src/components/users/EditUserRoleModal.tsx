import { useState } from 'react';
import { Dialog } from '../Dialog';
import { Button, Icon, IconButton, SelectField } from '../../library';
import { roleLabels, userRoles } from '../../types/inventory';
import type { AppUser, UserRole } from '../../types/inventory';

type EditUserRoleModalProps = {
  user: AppUser;
  onClose: () => void;
  onSave: (userId: string, role: UserRole) => void;
};

export function EditUserRoleModal({ user, onClose, onSave }: EditUserRoleModalProps) {
  const [role, setRole] = useState<UserRole>(user.role);

  return (
    <Dialog labelledBy="edit-user-title" closeLabel="Fechar edição de usuário" onClose={onClose} size="sm" backdropClassName="bg-slate-950/55">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Gerenciar usuários</p>
          <h2 id="edit-user-title" className="mt-2 text-xl font-semibold text-slate-950">Editar perfil</h2>
          <p className="mt-1 text-sm text-slate-500">Atualize o nível de acesso desta conta.</p>
        </div>
        <IconButton label="Fechar edição de usuário" onClick={onClose}>
          <Icon name="close" className="h-5 w-5" />
        </IconButton>
      </header>

      <div className="space-y-5 px-6 py-6">
        <div className="rounded-md bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="mt-1 break-all text-xs text-slate-500">{user.email}</p>
        </div>
        <SelectField
          label="Perfil de acesso"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          options={userRoles.map((userRole) => ({ value: userRole, label: roleLabels[userRole] }))}
        />
      </div>

      <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 px-6 py-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="button" onClick={() => onSave(user.id, role)}>Salvar perfil</Button>
      </footer>
    </Dialog>
  );
}
