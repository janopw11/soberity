import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { Alert } from './Alert';

describe('Alert', () => {
  it('renders the title and message together, not color alone', async () => {
    await render(
      <Alert variant="danger" title="Error" message="Something went wrong." />,
    );

    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('Something went wrong.')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('renders without a title when none is provided', async () => {
    await render(<Alert message="Heads up." />);

    expect(screen.getByText('Heads up.')).toBeTruthy();
  });
});
