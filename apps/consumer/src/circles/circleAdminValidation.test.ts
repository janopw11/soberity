import { expect, test } from '@jest/globals';
import { circleAdminErrorKey, circleFormErrors } from './circleAdminValidation';
import { CircleError } from './circlesApi';

const valid = {
  name: 'Sober coffee',
  slug: 'sober-coffee-2',
  description: 'Meet for coffee',
  guidelines: 'Respect everyone',
};

test('accepts valid fields including trimmed input', () => {
  expect(
    Object.values(
      circleFormErrors({ ...valid, slug: ' sober-coffee-2 ' }),
    ).some(Boolean),
  ).toBe(false);
});

test.each([
  '',
  'Sober-Coffee',
  'sober coffee',
  'kawa-łódź',
  '-coffee',
  'coffee-',
  'sober--coffee',
  'a'.repeat(101),
])('flags invalid slug %s', (slug) => {
  expect(circleFormErrors({ ...valid, slug })).toEqual({
    name: false,
    slug: true,
    description: false,
    guidelines: false,
  });
});

test('marks every missing required field', () => {
  expect(
    circleFormErrors({ name: ' ', slug: ' ', description: '', guidelines: '' }),
  ).toEqual({ name: true, slug: true, description: true, guidelines: true });
});

test.each([
  [400, 'invalidFields'],
  [401, 'sessionExpired'],
  [403, 'accessDenied'],
  [409, 'conflict'],
  [500, 'adminError'],
])('distinguishes HTTP %s', (status, key) => {
  expect(circleAdminErrorKey(new CircleError(status as number))).toBe(
    `circles.${key}`,
  );
});

test('does not describe a network failure as missing privileges', () => {
  expect(circleAdminErrorKey(new TypeError('Failed to fetch'))).toBe(
    'circles.adminError',
  );
});
