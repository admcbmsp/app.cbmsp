import { calculateAvailableContentSpace } from './applicationLayout';

test('subtracts shell chrome, main padding, and view-specific reserved space', () => {
  expect(calculateAvailableContentSpace({
    viewportHeight: 667,
    topbarHeight: 64,
    mainPaddingTop: 24,
    mainPaddingBottom: 24,
    reservedHeight: 80,
  })).toBe(475);
});

test('clamps available content space to zero', () => {
  expect(calculateAvailableContentSpace({
    viewportHeight: 48,
    topbarHeight: 64,
    mainPaddingTop: 24,
    mainPaddingBottom: 24,
  })).toBe(0);
});
