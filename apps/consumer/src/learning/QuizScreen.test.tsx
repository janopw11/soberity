import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import QuizScreen from './QuizScreen';
const mockRequest =
  jest.fn<(path: string, options?: { body?: unknown }) => Promise<unknown>>();
const mockGetToken = jest.fn(async () => 'fixture-token');
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({
    status: 'authenticated',
    user: { uid: 'fixture-user' },
    getIdToken: mockGetToken,
  }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'quiz-fixture' }),
  useRouter: () => ({ replace: jest.fn() }),
  useFocusEffect: () => undefined,
}));
jest.mock('./ProgressControl', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('./learningApi', () => ({
  ...jest.requireActual<typeof import('./learningApi')>('./learningApi'),
  learningRequest: (path: string, options?: { body?: unknown }) =>
    mockRequest(path, options),
}));
describe('Completed quiz results', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockImplementation(async (path) => {
      if (path.endsWith('/answers'))
        return {
          question_id: 'q1',
          correct: false,
          selected_option_ids: ['wrong'],
          correct_option_ids: ['right'],
          explanation: 'Fixture explanation',
          sources: [],
          claim_id: null,
          revision_id: null,
        };
      if (path.endsWith('/complete')) return { percentage: 0 };
      return {
        id: 'quiz-fixture',
        title: 'Fixture quiz',
        locale: 'en',
        version: 1,
        questions: [
          {
            id: 'q1',
            type: 'SINGLE_CHOICE',
            prompt: 'Fixture question',
            options: [
              { id: 'right', label: 'Right option' },
              { id: 'wrong', label: 'Wrong option' },
            ],
          },
        ],
      };
    });
  });
  it('saves on Finish, displays percentage and starts a clean retake with a new attempt ID', async () => {
    await render(<QuizScreen />);
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Wrong option' })).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Wrong option' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Check answer' }));
    await waitFor(() =>
      expect(screen.getByText('Fixture explanation')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Finish quiz' }));
    await waitFor(() => expect(screen.getByText('Result: 0%')).toBeTruthy());
    const first = mockRequest.mock.calls.find(([path]) =>
      path.endsWith('/complete'),
    )?.[1]?.body as { attemptId: string };
    expect(first.attemptId).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Repeat quiz' }));
    expect(screen.queryByText('Result: 0%')).toBeNull();
    await fireEvent.press(screen.getByRole('radio', { name: 'Wrong option' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Check answer' }));
    await waitFor(() =>
      expect(screen.getByText('Fixture explanation')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Finish quiz' }));
    await waitFor(() => expect(screen.getByText('Result: 0%')).toBeTruthy());
    const calls = mockRequest.mock.calls.filter(([path]) =>
      path.endsWith('/complete'),
    );
    expect((calls[1]?.[1]?.body as { attemptId: string }).attemptId).not.toBe(
      first.attemptId,
    );
  });
  it('keeps answers after a save failure and retries the same completion ID', async () => {
    const implementation = mockRequest.getMockImplementation()!;
    let fail = true;
    mockRequest.mockImplementation(async (path, options) => {
      if (path.endsWith('/complete') && fail) {
        fail = false;
        throw new Error('Offline');
      }
      return implementation(path, options);
    });
    await render(<QuizScreen />);
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: 'Wrong option' })).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'Wrong option' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Check answer' }));
    await waitFor(() =>
      expect(screen.getByText('Fixture explanation')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Finish quiz' }));
    await waitFor(() =>
      expect(screen.getByText(/Your result could not be saved/)).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Finish quiz' }));
    await waitFor(() => expect(screen.getByText('Result: 0%')).toBeTruthy());
    const calls = mockRequest.mock.calls.filter(([path]) =>
      path.endsWith('/complete'),
    );
    expect(calls[0]?.[1]?.body).toEqual(calls[1]?.[1]?.body);
  });
});
