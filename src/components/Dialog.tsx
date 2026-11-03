import { ReactNode } from 'react';
import { CardBox } from '../library/CardBox';
import { cn } from '../library/utils/cn';

export type DialogSize = 'sm' | 'md' | 'lg';

type DialogProps = {
  labelledBy: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  size?: DialogSize;
  panelClassName?: string;
  backdropClassName?: string;
};

const dialogSizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
};

/** Casca compartilhada para diálogos compostos por cabeçalho, conteúdo e ações. */
export function Dialog({
  labelledBy,
  closeLabel,
  onClose,
  children,
  size = 'md',
  panelClassName,
  backdropClassName,
}: DialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className={cn('absolute inset-0 bg-slate-950/50 backdrop-blur-sm', backdropClassName)}
      />
      <CardBox
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        padding="none"
        className={cn(
          'relative w-full overflow-hidden rounded-md border-0 p-0 shadow-2xl',
          dialogSizeClasses[size],
          panelClassName,
        )}
      >
        {children}
      </CardBox>
    </div>
  );
}
