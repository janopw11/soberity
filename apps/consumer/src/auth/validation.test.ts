import { describe, expect, it } from '@jest/globals';

import {
  DISPLAY_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  hasFieldErrors,
  validateDisplayName,
  validateEmail,
  validatePassword,
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
