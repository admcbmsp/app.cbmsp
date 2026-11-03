import { FormEvent, useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';
import type { InventoryColumnKey } from '../types/inventory';
import type { InventoryFilters, SavedInventoryView } from '../types/inventoryViews';
import {
  browserKeyValueStorage,
  createSavedInventoryViewRepository,
} from '../services/savedInventoryViews';

type TemplateToast = {
  message: string;
  tone: 'success' | 'info';
  detail?: string;
} | null;

type InventoryViewTemplatesProps = {
  userId: string;
  autoApplyDefaultOnEntry: boolean;
  filters: InventoryFilters | null;
  columns: InventoryColumnKey[];
  onApply: (filters: InventoryFilters | null, columns: InventoryColumnKey[]) => void;
  onToast: (toast: TemplateToast) => void;
};

const repository = createSavedInventoryViewRepository(browserKeyValueStorage);

export function InventoryViewTemplates({ userId, autoApplyDefaultOnEntry, filters, columns, onApply, onToast }: InventoryViewTemplatesProps) {
  const [templates, setTemplates] = useState<SavedInventoryView[]>([]);
  const [defaultTemplateId, setDefaultTemplateId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const didAutoApplyRef = useRef(false);

  useEffect(() => {
    let isCurrent = true;
    didAutoApplyRef.current = false;
    setIsLoading(true);
    setLoadError(false);
    setTemplates([]);
    Promise.all([repository.list(userId), repository.getDefault(userId)])
      .then(async ([savedViews, savedDefaultId]) => {
        const nextDefaultId = savedViews.some((view) => view.id === savedDefaultId)
          ? savedDefaultId
          : savedViews[0]?.id ?? null;
        if (nextDefaultId !== savedDefaultId) await repository.setDefault(userId, nextDefaultId);
        if (isCurrent) {
          setTemplates(savedViews);
          setDefaultTemplateId(nextDefaultId);
        }
      })
      .catch(() => {
        if (isCurrent) setLoadError(true);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });
    return () => { isCurrent = false; };
  }, [userId]);

  useEffect(() => {
    if (isLoading || didAutoApplyRef.current) return;
    didAutoApplyRef.current = true;
    if (!autoApplyDefaultOnEntry) return;
    const defaultTemplate = templates.find((template) => template.id === defaultTemplateId) ?? templates[0];
    if (defaultTemplate) onApply(defaultTemplate.filters, defaultTemplate.columns);
  }, [autoApplyDefaultOnEntry, defaultTemplateId, isLoading, onApply, templates]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const refreshTemplates = async () => {
    const [savedViews, savedDefaultId] = await Promise.all([repository.list(userId), repository.getDefault(userId)]);
    setTemplates(savedViews);
    setDefaultTemplateId(savedDefaultId);
    setLoadError(false);
  };

  const hasDuplicateName = (name: string, ignoreId?: string) =>
    templates.some((template) => template.id !== ignoreId && template.name.toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR'));

  const saveCurrentView = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setFormError('Informe um nome para o template.');
      return;
    }
    if (hasDuplicateName(name)) {
      setFormError('Já existe um template com esse nome.');
      return;
    }

    setIsSaving(true);
    setFormError('');
    try {
      await repository.create(userId, { name, filters, columns });
      await refreshTemplates();
      setNewName('');
      setShowSaveForm(false);
      onToast({ message: 'Template salvo neste dispositivo.', tone: 'success' });
    } catch {
      setFormError('Não foi possível salvar. Verifique o armazenamento do navegador e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = (template: SavedInventoryView) => {
    onApply(template.filters, template.columns);
    setIsOpen(false);
    setDefaultTemplateId(template.id);
    repository.setDefault(userId, template.id).catch(() => {
      onToast({ message: 'O template foi aplicado, mas não foi possível defini-lo como padrão.', tone: 'info' });
    });
    onToast({ message: `Template “${template.name}” aplicado.`, tone: 'success' });
  };

  const setAsDefault = async (template: SavedInventoryView) => {
    setBusyId(template.id);
    try {
      await repository.setDefault(userId, template.id);
      setDefaultTemplateId(template.id);
      onToast({ message: `“${template.name}” abrirá automaticamente na consulta.`, tone: 'success' });
    } catch {
      onToast({ message: 'Não foi possível definir o template padrão.', tone: 'info' });
    } finally {
      setBusyId(null);
    }
  };

  const updateTemplate = async (template: SavedInventoryView) => {
    setBusyId(template.id);
    try {
      await repository.update(userId, template.id, { filters, columns });
      await refreshTemplates();
      onToast({ message: `Template “${template.name}” atualizado.`, tone: 'success' });
    } catch {
      onToast({ message: 'Não foi possível atualizar o template.', tone: 'info' });
    } finally {
      setBusyId(null);
    }
  };

  const renameTemplate = async (event: FormEvent<HTMLFormElement>, template: SavedInventoryView) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (!name) {
      setFormError('Informe um nome para o template.');
      return;
    }
    if (hasDuplicateName(name, template.id)) {
      setFormError('Já existe um template com esse nome.');
      return;
    }

    setBusyId(template.id);
    setFormError('');
    try {
      await repository.update(userId, template.id, { name });
      await refreshTemplates();
      setRenamingId(null);
      onToast({ message: 'Nome do template atualizado.', tone: 'success' });
    } catch {
      setFormError('Não foi possível renomear o template.');
    } finally {
      setBusyId(null);
    }
  };

  const removeTemplate = async (template: SavedInventoryView) => {
    setBusyId(template.id);
    try {
      await repository.remove(userId, template.id);
      await refreshTemplates();
      setDeleteConfirmationId(null);
      onToast({ message: `Template “${template.name}” excluído.`, tone: 'success' });
    } catch {
      onToast({ message: 'Não foi possível excluir o template.', tone: 'info' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isOpen ? 'border-primary bg-[var(--color-hover)] text-primary' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
      >
        <Icon name="archive" className="h-4 w-4" />
        <span>Modelos</span>
        {templates.length > 0 && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{templates.length}</span>}
      </button>

      {isOpen && (
        <section role="dialog" aria-label="Templates de filtros e colunas" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 flex max-h-[calc(100vh-8rem)] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Modelos salvos</h2>
              <p className="mt-0.5 text-xs text-slate-500">Filtros e colunas neste dispositivo</p>
            </div>
            <button type="button" aria-label="Fechar modelos" onClick={() => setIsOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <Icon name="close" className="h-4 w-4" />
            </button>
          </header>

          <div className="overflow-y-auto p-3">
            <button
              type="button"
              onClick={() => { setShowSaveForm((current) => !current); setFormError(''); setRenamingId(null); }}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 ${COLOR_TRANSITION_CLASS} hover:border-primary hover:bg-[var(--color-hover)] hover:text-primary`}
            >
              <Icon name="plus" className="h-4 w-4" />
              Salvar configuração atual
            </button>

            {showSaveForm && (
              <form onSubmit={saveCurrentView} className="mt-3 rounded-xl bg-slate-50 p-3">
                <label htmlFor="new-inventory-view-name" className="mb-1.5 block text-xs font-semibold text-slate-700">Nome do template</label>
                <input
                  id="new-inventory-view-name"
                  autoFocus
                  maxLength={60}
                  value={newName}
                  onChange={(event) => { setNewName(event.target.value); setFormError(''); }}
                  placeholder="Ex.: Ferramentas em manutenção"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-[var(--color-focus)]"
                />
                {formError && <p role="alert" className="mt-2 text-xs text-rose-600">{formError}</p>}
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowSaveForm(false); setFormError(''); }} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-200">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{isSaving ? 'Salvando…' : 'Salvar'}</button>
                </div>
              </form>
            )}

            {loadError && <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Não foi possível acessar os templates locais neste navegador.</p>}
            {isLoading ? (
              <p className="px-2 py-5 text-center text-sm text-slate-500">Carregando templates…</p>
            ) : templates.length === 0 ? (
              <p className="px-2 py-5 text-center text-sm text-slate-500">Nenhum template salvo ainda.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {templates.map((template) => (
                  <li key={template.id} className="rounded-xl border border-slate-200 p-3">
                    {renamingId === template.id ? (
                      <form onSubmit={(event) => renameTemplate(event, template)}>
                        <label htmlFor={`rename-view-${template.id}`} className="mb-1.5 block text-xs font-semibold text-slate-700">Novo nome</label>
                        <input
                          id={`rename-view-${template.id}`}
                          autoFocus
                          maxLength={60}
                          value={renameValue}
                          onChange={(event) => { setRenameValue(event.target.value); setFormError(''); }}
                          className="h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-[var(--color-focus)]"
                        />
                        {formError && <p role="alert" className="mt-2 text-xs text-rose-600">{formError}</p>}
                        <div className="mt-2 flex justify-end gap-2">
                          <button type="button" onClick={() => { setRenamingId(null); setFormError(''); }} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">Cancelar</button>
                          <button type="submit" disabled={busyId === template.id} className="rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">Salvar nome</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <button type="button" onClick={() => applyTemplate(template)} className="block w-full rounded-lg text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                          <span className="block truncate text-sm font-semibold text-slate-800">{template.name}</span>
                          <span className="mt-1 block text-[11px] text-slate-400">Atualizado {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(template.updatedAt))} · {template.columns.length} coluna(s)</span>
                          {defaultTemplateId === template.id && <span className="mt-1 inline-flex rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-[10px] font-semibold text-primary">Abre automaticamente</span>}
                        </button>
                        <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-100 pt-2">
                          <button type="button" onClick={() => applyTemplate(template)} className="rounded-lg bg-[var(--color-hover)] px-2 py-1 text-xs font-semibold text-primary hover:opacity-80">Aplicar</button>
                          {defaultTemplateId !== template.id && <button type="button" disabled={busyId === template.id} onClick={() => setAsDefault(template)} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50">Definir padrão</button>}
                          <button type="button" disabled={busyId === template.id} onClick={() => updateTemplate(template)} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50">Atualizar</button>
                          <button type="button" onClick={() => { setRenamingId(template.id); setRenameValue(template.name); setFormError(''); setShowSaveForm(false); }} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100">Renomear</button>
                          <button type="button" onClick={() => setDeleteConfirmationId(template.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50">Excluir</button>
                        </div>
                        {deleteConfirmationId === template.id && (
                          <div className="mt-2 rounded-lg bg-rose-50 p-2.5">
                            <p className="text-xs text-rose-800">Excluir “{template.name}”?</p>
                            <div className="mt-2 flex justify-end gap-2">
                              <button type="button" onClick={() => setDeleteConfirmationId(null)} className="rounded-lg px-2 py-1 text-xs text-slate-600 hover:bg-white">Cancelar</button>
                              <button type="button" disabled={busyId === template.id} onClick={() => removeTemplate(template)} className="rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50">Confirmar exclusão</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
