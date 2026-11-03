import type { ItemState, ItemStatus, OperationalStatus } from '../../types/inventory';
import {
  getOperationalStatusClasses,
  getOperationalStatusLabel,
  getStateClasses,
  getStateLabel,
  getStatusClasses,
  getStatusLabel,
} from '../../utils/inventory';

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusClasses(status)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {getStatusLabel(status)}
    </span>
  );
}

export function StateBadge({ state }: { state: ItemState }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getStateClasses(state)}`}>
      {getStateLabel(state)}
    </span>
  );
}

export function OperationalStatusBadge({ status }: { status: OperationalStatus }) {
  return (
    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getOperationalStatusClasses(status)}`}>
      {getOperationalStatusLabel(status)}
    </span>
  );
}
