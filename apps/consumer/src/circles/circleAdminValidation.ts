import { CircleError } from './circlesApi';

export function circleFormErrors(form: {
  name: string;
  slug: string;
  description: string;
  guidelines: string;
}) {
  return {
    name: !form.name.trim() || form.name.trim().length > 120,
    slug:
      form.slug.trim().length > 100 ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug.trim()),
    description:
      !form.description.trim() || form.description.trim().length > 4000,
    guidelines: !form.guidelines.trim() || form.guidelines.trim().length > 6000,
  };
}

export function circleAdminErrorKey(error: unknown) {
  if (error instanceof CircleError) {
    if (error.status === 400) return 'circles.invalidFields';
    if (error.status === 401) return 'circles.sessionExpired';
    if (error.status === 403) return 'circles.accessDenied';
    if (error.status === 409) return 'circles.conflict';
  }
  return 'circles.adminError';
}
