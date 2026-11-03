import { useEffect, useRef, useState } from 'react';
import type { City } from '../types/inventory';
import { COLOR_TRANSITION_CLASS } from '../theme/motion';
import { getCityLabel } from '../utils/inventory';
import { Icon } from './Icon';

type UnitScopeSelectorProps = {
  options: readonly City[];
  selectedUnit: City | null;
  onChange: (unit: City | null) => void;
  onSelect: () => void;
};

export function UnitScopeSelector({ options, selectedUnit, onChange, onSelect }: UnitScopeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = 'unit-scope-options';
  const selectedLabel = selectedUnit ? getCityLabel(selectedUnit) : 'Todas as unidades';

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) setIsOpen(false);
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

  const selectUnit = (unit: City | null) => {
    onChange(unit);
    setIsOpen(false);
    onSelect();
  };

  return (
    <div ref={containerRef} className="relative mt-4">
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Selecionar unidade. Atual: ${selectedLabel}`}
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex min-h-12 w-full items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-left ${COLOR_TRANSITION_CLASS} hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
      >
        <Icon name="briefcase" className="h-5 w-5 shrink-0 text-slate-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Unidade de atuação</span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-slate-100">{selectedLabel}</span>
        </span>
        <Icon name="chevron-down" className={`h-4 w-4 shrink-0 text-slate-400 ${COLOR_TRANSITION_CLASS} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div id={menuId} role="group" aria-label="Unidade global" className="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/25">
          <button
            type="button"
            aria-pressed={selectedUnit === null}
            onClick={() => selectUnit(null)}
            className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm ${COLOR_TRANSITION_CLASS} ${selectedUnit === null ? 'bg-[var(--color-hover)] font-semibold text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <span>Todas as unidades</span>
            {selectedUnit === null && <Icon name="check" className="h-4 w-4 shrink-0" />}
          </button>
          {options.map((unit) => (
            <button
              key={unit}
              type="button"
              aria-pressed={selectedUnit === unit}
              onClick={() => selectUnit(unit)}
              className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm ${COLOR_TRANSITION_CLASS} ${selectedUnit === unit ? 'bg-[var(--color-hover)] font-semibold text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <span className="truncate">{getCityLabel(unit)}</span>
              {selectedUnit === unit && <Icon name="check" className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
