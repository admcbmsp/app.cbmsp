import { ReactNode, SVGProps } from 'react';

// The prototype keeps a tiny local Lucide-compatible registry so every surface
// uses the same stroke, sizing and icon names without coupling components to
// two different icon implementations.
export type IconName =
  | 'alert-circle'
  | 'archive'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-up-right'
  | 'briefcase'
  | 'calendar'
  | 'check'
  | 'columns'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'circle'
  | 'clock'
  | 'close'
  | 'currency'
  | 'dashboard'
  | 'download'
  | 'edit'
  | 'eye'
  | 'eye-off'
  | 'filter'
  | 'flame'
  | 'history'
  | 'info'
  | 'lock'
  | 'logout'
  | 'menu'
  | 'minus'
  | 'more-horizontal'
  | 'moon'
  | 'plus'
  | 'search'
  | 'shield'
  | 'sun'
  | 'truck'
  | 'user'
  | 'users';

export type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

const iconPaths: Record<IconName, ReactNode> = {
  'alert-circle': <><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5M12 16h.01" /></>,
  archive: <><path d="M4 7.5h16v12H4z" /><path d="M3 4.5h18v3H3zM9 11.5h6" /></>,
  'arrow-down': <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />,
  'arrow-left': <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />,
  'arrow-right': <path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5" />,
  'arrow-up': <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />,
  'arrow-up-right': <path d="M7 17 17 7M8 7h9v9" />,
  briefcase: <><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 9h16M8 13h.01M12 13h.01M16 13h.01M8 16h.01M12 16h.01" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  columns: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16M15 4v16" /></>,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'chevron-up': <path d="m6 15 6-6 6 6" />,
  circle: <circle cx="12" cy="12" r="8.5" />,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  currency: <path d="M17 7.5c-.8-1-2.1-1.5-3.7-1.5-2.3 0-3.8 1.2-3.8 2.8 0 4.1 7.5 1.9 7.5 5.5 0 1.7-1.6 2.9-4 2.9-1.8 0-3.3-.6-4.2-1.7M12.8 4v16M6.5 9h11M6.5 15h11" />,
  dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  download: <path d="M12 4v11M7.5 11.5 12 16l4.5-4.5M5 20h14" />,
  edit: <path d="m15 5 4 4M5 19l1.2-4.2L15 6a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2l-8.8 8.8L5 19Z" />,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  'eye-off': <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.3A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a16.8 16.8 0 0 1-3.1 4.3M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.3 4-.8" /></>,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  flame: <path d="M13.8 3.5c.6 3.1-1 4.5-2.7 6.1-1.1 1-1.9 2-1.9 3.6a2.8 2.8 0 0 0 2.8 2.8c2 0 3.1-1.6 2.9-3.7 2.1 1.2 3.4 3.2 3.4 5.1 0 2.9-2.4 5.1-5.5 5.1-4.7 0-7.1-3.3-7.1-6.7 0-3 1.7-5.5 4.1-7.7 1.4-1.3 2.8-2.7 4-4.6Z" />,
  history: <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 5v4h4M12 8v4l2.7 1.7" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 10.5v5M12 7.5h.01" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  logout: <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  minus: <path d="M5 12h14" />,
  'more-horizontal': <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  moon: <path d="M12 3a6.36 6.36 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  shield: <><path d="M12 3 19 6v5.2c0 4.6-2.8 7.8-7 9.8-4.2-2-7-5.2-7-9.8V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>,
  truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.5-3.3 2.8-5 6.5-5s6 1.7 6.5 5" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.4-3.2 2.2-4.8 5.5-4.8s5.1 1.6 5.5 4.8M16 5.5a3 3 0 0 1 0 5.8M16.5 14.5c2.4.3 3.7 1.8 4 4" /></>,
};

export function Icon({ name, ...props }: IconProps) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={props.strokeWidth ?? 2}
      viewBox="0 0 24 24"
      aria-hidden={props['aria-hidden'] ?? true}
    >
      {iconPaths[name]}
    </svg>
  );
}
