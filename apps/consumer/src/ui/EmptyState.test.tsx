import { describe, expect, it } from '@jest/globals';
import { screen } from '@testing-library/react-native';

import { render } from '../test-utils';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders eyebrow, title and description', async () => {
    await render(
      <EmptyState
        eyebrow="Not available yet"
        title="Science"
        description="Planned: source-based articles, flashcards and quizzes."
      />,
    );

    expect(screen.getByText('Not available yet')).toBeTruthy();
    expect(screen.getByRole('header', { name: 'Science' })).toBeTruthy();
    expect(
      screen.getByText(
        'Planned: source-based articles, flashcards and quizzes.',
      ),
    ).toBeTruthy();
  });
});
