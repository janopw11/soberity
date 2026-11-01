export const PASSWORD_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldError =
  'required' | 'invalidEmail' | 'passwordTooShort' | 'passwordMismatch';

export function validateEmail(value: string): FieldError | undefined {
  const email = value.trim();
  if (!email) return 'required';
  if (!EMAIL_PATTERN.test(email)) return 'invalidEmail';
  return undefined;
}

export function validatePassword(value: string): FieldError | undefined {
  if (!value) return 'required';
  if (value.length < PASSWORD_MIN_LENGTH) return 'passwordTooShort';
  return undefined;
}

export function validateSignIn(input: { email: string; password: string }) {
  return {
    email: validateEmail(input.email),
    password: input.password ? undefined : ('required' as const),
  };
}

export function validateSignUp(input: {
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const password = validatePassword(input.password);
  let confirmPassword: FieldError | undefined;
  if (!input.confirmPassword) {
    confirmPassword = 'required';
  } else if (input.confirmPassword !== input.password) {
    confirmPassword = 'passwordMismatch';
  }

  return { email: validateEmail(input.email), password, confirmPassword };
}

export function hasFieldErrors(
  errors: Record<string, string | undefined>,
): boolean {
  return Object.values(errors).some(Boolean);
}
