export type AvailableContentSpaceMeasurements = {
  viewportHeight: number;
  topbarHeight: number;
  mainPaddingTop: number;
  mainPaddingBottom: number;
  reservedHeight?: number;
};

export type AvailableContentSpaceOptions = {
  mainElement?: HTMLElement | null;
  reservedElements?: readonly (HTMLElement | null)[];
};

const parsePixelValue = (value: string | undefined) => {
  const parsedValue = Number.parseFloat(value ?? '');
  return Number.isFinite(parsedValue) ? parsedValue : 0;
};

/** Returns the vertical space a view can use after shell chrome and view-specific reservations. */
export function calculateAvailableContentSpace({
  viewportHeight,
  topbarHeight,
  mainPaddingTop,
  mainPaddingBottom,
  reservedHeight = 0,
}: AvailableContentSpaceMeasurements) {
  return Math.max(0, viewportHeight - topbarHeight - mainPaddingTop - mainPaddingBottom - reservedHeight);
}

/** Measures current app chrome and optional view elements to size a view on demand. */
export function getAvailableContentSpace({
  mainElement,
  reservedElements = [],
}: AvailableContentSpaceOptions = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;

  const main = mainElement === undefined
    ? document.querySelector<HTMLElement>('.application-main')
    : mainElement;
  if (!main) return 0;

  const shell = main.closest('.application-shell');
  const topbar = shell?.querySelector<HTMLElement>('.application-topbar');
  const mainStyles = window.getComputedStyle(main);
  const reservedHeight = reservedElements.reduce((total, element) => (
    total + (element?.getBoundingClientRect().height ?? 0)
  ), 0);

  return calculateAvailableContentSpace({
    viewportHeight: window.visualViewport?.height ?? window.innerHeight,
    topbarHeight: topbar?.getBoundingClientRect().height ?? 0,
    mainPaddingTop: parsePixelValue(mainStyles.paddingTop),
    mainPaddingBottom: parsePixelValue(mainStyles.paddingBottom),
    reservedHeight,
  });
}
