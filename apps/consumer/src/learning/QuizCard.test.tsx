import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { render } from '../test-utils';
import { QuizCard } from './QuizCard';
import type { QuizSummary } from './learningApi';
const base: QuizSummary = {
  id: 'fixture',
  title: 'Fixture quiz',
  locale: 'en',
  version: 1,
  publication_route: 'AUTHOR',
  question_count: 5,
};
describe('Quiz score bands', () => {
  it.each([
    { score: 0, color: '#B42318' },
    { score: 39, color: '#B42318' },
    { score: 40, color: '#A84B00' },
    { score: 79, color: '#A84B00' },
    { score: 80, color: '#176B48' },
    { score: 100, color: '#176B48' },
  ])(
    'colors $score percent and keeps retakes enabled',
    async ({ score, color }) => {
      const onStart = jest.fn();
      await render(
        <QuizCard
          quiz={{
            ...base,
            completion: {
              quiz_id: 'fixture',
              attempt_id: 'fixture-attempt',
              version: 1,
              correct_count: 1,
              question_count: 5,
              percentage: score,
              completed_at: '2026-11-04T12:00:00Z',
            },
          }}
          onStart={onStart}
        />,
      );
      expect(screen.getByText(`Result: ${score}%`)).toBeTruthy();
      expect(
        StyleSheet.flatten(
          screen.getByRole('header', { name: 'Fixture quiz' }).props.style,
        ).color,
      ).toBe(color);
      await fireEvent.press(
        screen.getByRole('button', { name: 'Fixture quiz' }),
      );
      expect(onStart).toHaveBeenCalledTimes(1);
    },
  );
  it('keeps unfinished quizzes blue and does not invent a result', async () => {
    await render(<QuizCard quiz={base} onStart={() => undefined} />);
    expect(
      StyleSheet.flatten(
        screen.getByRole('header', { name: 'Fixture quiz' }).props.style,
      ).color,
    ).toBe('#006C9C');
    expect(screen.getByRole('button', { name: 'Fixture quiz' })).toBeTruthy();
    expect(screen.queryByText(/Result:/)).toBeNull();
  });
});
