import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import LearningScreen from './LearningScreen';

const mockRequest = jest.fn<(path: string) => Promise<unknown>>();
const mockPush = jest.fn();
let mockStatus = 'guest';
const mockGetToken = jest.fn(async () => 'fixture-token');
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({
    status: mockStatus,
    user: mockStatus === 'authenticated' ? { uid: 'fixture-user' } : null,
    getIdToken: mockGetToken,
  }),
}));
jest.mock('./learningApi', () => ({
  learningRequest: (path: string) => mockRequest(path),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: () => undefined,
}));

describe('Quizzes list', () => {
  beforeEach(() => {
    mockStatus = 'guest';
    mockRequest.mockReset();
    mockPush.mockClear();
  });

  it('opens on four category cards and fetches only the selected category', async () => {
    mockRequest.mockResolvedValue({ items: [], page: 0, size: 20, total: 0 });
    await render(<LearningScreen quizzesOnly />);
    for (const name of ['Brain', 'Relationships', 'Alco Facts', 'Sport']) expect(screen.getByRole('button', { name })).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Sport' }));
    await waitFor(() => expect(mockRequest).toHaveBeenCalledWith(expect.stringContaining('&category=sport')));
    await fireEvent.press(screen.getByRole('button', { name: 'All categories' }));
    expect(screen.getByRole('button', { name: 'Brain' })).toBeTruthy();
  });

  it('shows only the styled empty message without redundant headings or navigation', async () => {
    mockRequest.mockResolvedValue({ items: [], page: 0, size: 20, total: 0 });
    await render(<LearningScreen quizzesOnly />);
    await fireEvent.press(screen.getByRole('button', { name: 'Brain' }));
    await waitFor(() =>
      expect(screen.getByRole('header', { name: 'No quizzes' })).toBeTruthy(),
    );
    expect(screen.queryByText('Quizzes')).toBeNull();
    expect(screen.queryByText('Back to Discover')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
  });

  it('uses page counts and arrow controls, respecting both pagination boundaries', async () => {
    mockRequest.mockImplementation(async (path) => {
      const page = Number(
        new URL(path, 'https://example.test').searchParams.get('page'),
      );
      return {
        items: [
          { id: 'quiz-fixture', title: 'Fixture quiz', question_count: 3 },
        ],
        page,
        size: 1,
        total: 2,
      };
    });
    await render(<LearningScreen quizzesOnly />);
    await fireEvent.press(screen.getByRole('button', { name: 'Brain' }));
    await waitFor(() =>
      expect(screen.getByText('Page 1 of 2 · Quizzes: 2')).toBeTruthy(),
    );
    expect(
      screen.getByRole('button', { name: 'Previous' }).props.accessibilityState
        .disabled,
    ).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() =>
      expect(screen.getByText('Page 2 of 2 · Quizzes: 2')).toBeTruthy(),
    );
    expect(
      screen.getByRole('button', { name: 'Next' }).props.accessibilityState
        .disabled,
    ).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() =>
      expect(screen.getByText('Page 1 of 2 · Quizzes: 2')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Fixture quiz' }));
    expect(mockPush).toHaveBeenCalledWith('/science/quiz/quiz-fixture');
  });
  it('loads a signed-in user result and still offers a retake', async () => {
    mockStatus = 'authenticated';
    mockRequest.mockImplementation(async (path) =>
      path.endsWith('/results')
        ? [{ quiz_id: 'fixture', version: 1, percentage: 80 }]
        : {
            items: [
              {
                id: 'fixture',
                version: 1,
                title: 'Fixture quiz',
                question_count: 5,
              },
            ],
            page: 0,
            size: 20,
            total: 1,
          },
    );
    await render(<LearningScreen quizzesOnly />);
    await fireEvent.press(screen.getByRole('button', { name: 'Brain' }));
    await waitFor(() => expect(screen.getByText('Result: 80%')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Fixture quiz' }));
    expect(mockPush).toHaveBeenCalledWith('/science/quiz/fixture');
  });
});
