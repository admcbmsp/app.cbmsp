import type { ItemState, ItemStatus, OperationalStatus } from '../../types/inventory';
import {
  operationalStatusLabels,
  stateLabels,
  statusLabels,
} from '../../types/inventory';

export enum BadgeKind {
  Status = 'status',
  State = 'state',
  OperationalStatus = 'operationalStatus',
}

type BadgeValueByKind = {
  [BadgeKind.Status]: ItemStatus;
  [BadgeKind.State]: ItemState;
  [BadgeKind.OperationalStatus]: OperationalStatus;
};

type BadgeProps = {
  [Kind in BadgeKind]: { kind: Kind; value: BadgeValueByKind[Kind]; size?: 'compact' | 'regular' };
}[BadgeKind];

type BadgeTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

type BadgeDefinition = {
  label: string;
  tone: BadgeTone;
};

const badgeDefinitions = {
  [BadgeKind.Status]: {
    active: { label: statusLabels.active, tone: 'success' },
    pending: { label: statusLabels.pending, tone: 'warning' },
    rejected: { label: statusLabels.rejected, tone: 'error' },
    deactivated: { label: statusLabels.deactivated, tone: 'neutral' },
  },
  [BadgeKind.State]: {
    novo: { label: stateLabels.novo, tone: 'primary' },
    bom: { label: stateLabels.bom, tone: 'success' },
    regular: { label: stateLabels.regular, tone: 'warning' },
  },
  [BadgeKind.OperationalStatus]: {
    operacional: { label: operationalStatusLabels.operacional, tone: 'success' },
    'em-manutencao': { label: operationalStatusLabels['em-manutencao'], tone: 'warning' },
    inservivel: { label: operationalStatusLabels.inservivel, tone: 'error' },
    'em-transito': { label: operationalStatusLabels['em-transito'], tone: 'primary' },
  },
} satisfies {
  [Kind in BadgeKind]: Record<BadgeValueByKind[Kind], BadgeDefinition>;
};

function getBadgeDefinition(props: BadgeProps): BadgeDefinition {
  switch (props.kind) {
    case BadgeKind.Status:
      return badgeDefinitions[BadgeKind.Status][props.value];
    case BadgeKind.State:
      return badgeDefinitions[BadgeKind.State][props.value];
    case BadgeKind.OperationalStatus:
      return badgeDefinitions[BadgeKind.OperationalStatus][props.value];
  }
}

export function StatusBadge(props: BadgeProps) {
  const definition = getBadgeDefinition(props);
  const size = props.size ?? 'compact';

  return (
    <span className={`inventory-badge inventory-badge--${definition.tone} inline-flex items-center rounded-md px-2.5 py-1 ${size === 'regular' ? 'text-sm' : 'text-xs'} font-semibold ring-1 ring-inset`}>
      {definition.label}
    </span>
  );
}
