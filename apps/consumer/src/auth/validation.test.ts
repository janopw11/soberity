import { describe, expect, it } from '@jest/globals';

import {
  PASSWORD_MIN_LENGTH,
  hasFieldErrors,
  validateEmail,
  validatePassword,
  validateSignUp,
} from './validation';

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
