/**
 * Shared interaction timing for the prototype.
 *
 * Keep the Tailwind class names literal so the compiler can include them in
 * the generated stylesheet while allowing every component to use the same
 * duration and easing.
 */
export const TRANSITION_DURATION_CLASS = 'duration-200 ease-out';

export const COLOR_TRANSITION_CLASS = `transition-colors ${TRANSITION_DURATION_CLASS}`;
export const INTERACTION_TRANSITION_CLASS = `transition ${TRANSITION_DURATION_CLASS}`;
export const TRANSFORM_TRANSITION_CLASS = `transition-transform ${TRANSITION_DURATION_CLASS}`;
