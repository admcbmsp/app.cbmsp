import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';

export type FilterDropdownOption = {
  value: string;
  label: string;
};

type FilterDropdownProps = {
  id: string;
  label: string;
  options: FilterDropdownOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
};

export function FilterDropdown({ id, label, options, selectedValues, onChange }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = `${id}-options`;
  const selectedOptions = options.filter((option) => selectedValues.includes(option.value));
  const selectionSummary = selectedOptions.length === 1
    ? `: ${selectedOptions[0].label}`
    : selectedOptions.length > 1
      ? `: ${selectedOptions[0].label} +${selectedOptions.length - 1}`
      : '';

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

  const toggleOption = (value: string) => {
    onChange(selectedValues.includes(value)
      ? selectedValues.filter((selected) => selected !== value)
      : [...selectedValues, value]);
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => setIsOpen((current) => !current)}
        className={`inline-flex h-10 max-w-64 items-center gap-2 rounded-md border px-3 text-sm font-medium ${COLOR_TRANSITION_CLASS} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selectedValues.length ? 'border-primary bg-[var(--color-hover)] text-primary' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
      >
        <span className="truncate">{label}{selectionSummary}</span>
        <Icon name="chevron-down" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      </button>

      {isOpen && (
        <div id={menuId} role="group" aria-labelledby={id} className="absolute left-0 top-[calc(100%+0.5rem)] z-40 flex max-h-80 w-56 flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl shadow-slate-900/10 sm:left-auto sm:right-0">
          <p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</p>
          <div className="overflow-y-auto p-2 pt-0">
            {options.map((option) => {
              const checked = selectedValues.includes(option.value);
              return (
                <label key={option.value} className={`flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm ${COLOR_TRANSITION_CLASS} ${checked ? 'bg-[var(--color-hover)] text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOption(option.value)}
                    className="h-4 w-4 shrink-0 rounded-sm accent-primary"
                  />
                  <span className="truncate">{option.label}</span>
                </label>
              );
            })}
            {options.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">Nenhuma opção disponível.</p>}
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
            <button type="button" onClick={() => onChange([])} className={`rounded-md px-2 py-1 text-sm text-slate-500 ${COLOR_TRANSITION_CLASS} hover:bg-slate-100 hover:text-slate-800`}>
              Limpar
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className={`rounded-md px-2 py-1 text-sm font-medium text-slate-800 ${COLOR_TRANSITION_CLASS} hover:bg-slate-100`}>
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
