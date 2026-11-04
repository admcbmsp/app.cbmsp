import { act, renderHook } from '@testing-library/react';
import { useApplicationViewportHeight } from './useApplicationViewportHeight';

const originalInnerHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight');

function setViewportHeight(height: number) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
}

afterEach(() => {
  if (originalInnerHeight) {
    Object.defineProperty(window, 'innerHeight', originalInnerHeight);
  }
});

test('keeps the application at least 667 pixels tall', () => {
  setViewportHeight(600);

  const { result } = renderHook(() => useApplicationViewportHeight());

  expect(result.current).toBe(667);
});

test('updates the application height when the viewport is resized', () => {
  setViewportHeight(800);

  const { result } = renderHook(() => useApplicationViewportHeight());
  expect(result.current).toBe(800);

  act(() => {
    setViewportHeight(900);
    window.dispatchEvent(new Event('resize'));
  });

  expect(result.current).toBe(900);
});
