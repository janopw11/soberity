import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from './TextField';

describe('TextField', () => {
  it('renders the label and forwards typed text', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Email" onChangeText={onChangeText} />);

    expect(screen.getByText('Email')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText('Email'),
      'user@example.com',
    );
    expect(onChangeText).toHaveBeenCalledWith('user@example.com');
  });

  it('shows helper text, and replaces it with an error when present', async () => {
    const { rerender } = await render(
      <TextField label="Email" helperText="We will never share it." />,
    );
    expect(screen.getByText('We will never share it.')).toBeTruthy();

    await rerender(
      <TextField
        label="Email"
        helperText="We will never share it."
        errorText="Email is required."
      />,
    );
    expect(screen.queryByText('We will never share it.')).toBeNull();
    expect(screen.getByText('Email is required.')).toBeTruthy();
  });

  it('toggles password visibility when secureToggle is enabled', async () => {
    await render(<TextField label="Password" secureToggle secureTextEntry />);

    const input = screen.getByLabelText('Password');
    expect(input.props.secureTextEntry).toBe(true);

    await fireEvent.press(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);

    await fireEvent.press(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });
});
