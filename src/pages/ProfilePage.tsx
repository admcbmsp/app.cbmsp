import { FormEvent, useState } from 'react';
import { Badge, Button, CardBox, Heading, InputField, SelectField } from '../library';
import { cityOptions } from '../types/inventory';
import type { AppUser, City } from '../types/inventory';
import { getCityLabel, getRoleLabel } from '../utils/inventory';

export type UserProfileValues = Pick<AppUser, 'firstName' | 'lastName' | 'patente' | 'unidade' | 'telefoneContato'>;

type ProfilePageProps = {
  user: AppUser;
  onSave: (values: UserProfileValues) => void;
};

export function ProfilePage({ user, onSave }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfileValues>(() => ({
    firstName: user.firstName,
    lastName: user.lastName,
    patente: user.patente,
    unidade: user.unidade,
    telefoneContato: user.telefoneContato,
  }));
  const [nameError, setNameError] = useState('');

  const updateField = <K extends keyof UserProfileValues>(key: K, value: UserProfileValues[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    if (key === 'firstName' || key === 'lastName') {
      setNameError('');
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setNameError('Informe nome e sobrenome.');
      return;
    }

    onSave({
      ...profile,
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      patente: profile.patente.trim(),
      telefoneContato: profile.telefoneContato.trim(),
    });
  };

  return (
    <section aria-labelledby="profile-page-title" className="application-page">
      <header className="mb-7 flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Conta pessoal</p>
          <Heading id="profile-page-title" level={1} className="mt-2 text-3xl sm:text-4xl">Meu perfil</Heading>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Mantenha seus dados de contato e identificação atualizados.</p>
        </div>
        <Badge variant="info" size="md">{getRoleLabel(user.role)}</Badge>
      </header>

      <form onSubmit={handleSubmit} className="application-page-form max-w-3xl">
        <CardBox>
          <div className="mb-6 border-b border-slate-100 pb-5">
            <h2 className="text-base font-semibold text-slate-950">Dados do usuário</h2>
            <p className="mt-1 text-sm text-slate-500">O e-mail e o perfil de acesso são administrados separadamente.</p>
            <p className="mt-4 break-all text-sm font-medium text-slate-700">{user.email}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <InputField
              label="Patente"
              value={profile.patente}
              onChange={(event) => updateField('patente', event.target.value)}
              autoComplete="honorific-prefix"
              placeholder="Ex.: Cap."
            />
            <SelectField
              label="Unidade"
              value={profile.unidade}
              onChange={(event) => updateField('unidade', event.target.value as City | '')}
              options={cityOptions.map((city) => ({ value: city, label: getCityLabel(city) }))}
              placeholder="Selecione uma unidade"
            />
            <InputField
              label="Nome"
              value={profile.firstName}
              onChange={(event) => updateField('firstName', event.target.value)}
              autoComplete="given-name"
              error={nameError && !profile.firstName.trim() ? nameError : undefined}
              required
            />
            <InputField
              label="Sobrenome"
              value={profile.lastName}
              onChange={(event) => updateField('lastName', event.target.value)}
              autoComplete="family-name"
              error={nameError && !profile.lastName.trim() ? nameError : undefined}
              required
            />
            <InputField
              label="Telefone de contato"
              type="tel"
              value={profile.telefoneContato}
              onChange={(event) => updateField('telefoneContato', event.target.value)}
              autoComplete="tel"
              placeholder="(00) 00000-0000"
              fieldClassName="sm:col-span-2"
            />
          </div>
        </CardBox>

        <div className="application-page-actions flex justify-end">
          <Button type="submit">Salvar perfil</Button>
        </div>
      </form>
    </section>
  );
}
