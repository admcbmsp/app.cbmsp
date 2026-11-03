import { render, screen } from '@testing-library/react';
import { BrandLogo } from './BrandLogo';

test('uses the official CBM SP logo asset with an accessible name', () => {
  render(<BrandLogo />);

  expect(screen.getByRole('img', { name: /corpo de bombeiros da polícia militar/i })).toHaveAttribute('src', '/cbmsp.svg');
});
