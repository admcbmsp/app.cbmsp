// Operational documentation: ./EditUserRoleModal.operations.md
import { FormEvent, useState } from 'react';
import { Dialog } from '../Dialog';
import { SelectField } from '../../library';
import { roleLabels, userRoles } from '../../types/inventory';
import type { AppUser, UserRole } from '../../types/inventory';

type EditUserRoleModalProps = {
  user: AppUser;
  onClose: () => void;
  onSave: (userId: string, role: UserRole) => void;
};

export function EditUserRoleModal({ user, onClose, onSave }: EditUserRoleModalProps) {
  const [role, setRole] = useState<UserRole>(user.role);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(user.id, role);
  };

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}
      title="Editar perfil"
      caption="Atualize o nível de acesso desta conta."
      closeLabel="Fechar edição de usuário"
      size="sm"
      actions={[
        { label: 'Cancelar', variant: 'secondary', onClick: onClose },
        { label: 'Salvar perfil', variant: 'primary', type: 'submit', form: 'edit-user-role-form' },
      ]}
    >
      <form id="edit-user-role-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-md bg-surface-muted px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">{user.email}</p>
        </div>
        <SelectField
          label="Perfil de acesso"
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          options={userRoles.map((userRole) => ({ value: userRole, label: roleLabels[userRole] }))}
        />
      </form>
    </Dialog>
  );
}
