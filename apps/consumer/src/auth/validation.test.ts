import { describe, expect, it } from '@jest/globals';

import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  hasFieldErrors,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
  validatePassword,
  validateSignIn,
  validateSignUp,
} from './validation';

describe('validateDisplayName', () => {
  it('treats the username as optional', () => {
    expect(validateDisplayName('')).toBeUndefined();
    expect(validateDisplayName('   ')).toBeUndefined();
  });

  it('enforces the maximum length after trimming', () => {
    expect(
      validateDisplayName(`  ${'x'.repeat(DISPLAY_NAME_MAX_LENGTH)}  `),
    ).toBeUndefined();
    expect(validateDisplayName('x'.repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toBe(
      'displayNameTooLong',
    );
  });
});

describe('validateEmail', () => {
  it('requires a value', () => {
    expect(validateEmail('   ')).toBe('required');
  });

  it('rejects malformed addresses', () => {
    expect(validateEmail('jane@')).toBe('invalidEmail');
    expect(validateEmail('jane example.com')).toBe('invalidEmail');
  });

  it('accepts a well-formed address', () => {
    expect(validateEmail(' jane@example.com ')).toBeUndefined();
  });
});

describe('validatePassword', () => {
  it('requires a value', () => {
    expect(validatePassword('')).toBe('required');
  });

  it('enforces the minimum length', () => {
    expect(validatePassword('x'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      'passwordTooShort',
    );
    expect(validatePassword('x'.repeat(PASSWORD_MIN_LENGTH))).toBeUndefined();
  });
});

describe('validateSignUp', () => {
  it('flags mismatched confirmation', () => {
    const errors = validateSignUp({
      email: 'jane@example.com',
      password: 'secret-password',
      confirmPassword: 'other-password',
    });

    expect(errors.confirmPassword).toBe('passwordMismatch');
    expect(hasFieldErrors(errors)).toBe(true);
  });

  it('passes when every field is valid and matches', () => {
    const errors = validateSignUp({
      email: 'jane@example.com',
      password: 'secret-password',
      confirmPassword: 'secret-password',
    });

    expect(hasFieldErrors(errors)).toBe(false);
  });
});

describe('validateSignIn', () => {
  it('validates email and requires a password', () => {
    expect(validateSignIn({ email: 'not-an-email', password: '' })).toEqual({
      email: 'invalidEmail',
      password: 'required',
    });
  });

  it('accepts a valid email and non-empty password', () => {
    expect(
      validateSignIn({ email: 'jane@example.com', password: 'x' }),
    ).toEqual({ email: undefined, password: undefined });
  });
});

describe('validateNewPassword', () => {
  it('requires a password and matching confirmation', () => {
    expect(validateNewPassword({ password: '', confirmPassword: '' })).toEqual({
      password: 'required',
      confirmPassword: 'required',
    });
  });

  it('checks minimum length and confirmation match', () => {
    expect(
      validateNewPassword({ password: 'short', confirmPassword: 'other' }),
    ).toEqual({
      password: 'passwordTooShort',
      confirmPassword: 'passwordMismatch',
    });
  });

  it('accepts a valid matching password', () => {
    expect(
      validateNewPassword({
        password: 'Soberity-2026!',
        confirmPassword: 'Soberity-2026!',
      }),
    ).toEqual({ password: undefined, confirmPassword: undefined });
  });
});
