import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import DiscoverScreen from './DiscoverScreen';

const mockGet = jest.fn<(path: string) => Promise<unknown>>();
jest.mock('./scienceApi', () => ({
  ...jest.requireActual<typeof import('./scienceApi')>('./scienceApi'),
  scienceGet: (path: string) => mockGet(path),
}));
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn() }),
  useFocusEffect: () => undefined,
}));

describe('Articles filters', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async path => path.includes('/categories')
      ? [{ code: 'sleep', label: 'Sleep' }]
      : { items: [], page: 0, size: 3, total: 0 });
  });

  it('encodes title search, combines category and shows a specific empty result', async () => {
    await render(<DiscoverScreen />);
    await fireEvent.changeText(screen.getByLabelText('Search titles'), '  Sleep & brain  ');
    await waitFor(() => expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('q=Sleep%20%26%20brain')));
    expect(screen.getByText('No matching publications')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Category' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Category' }).props.accessibilityState.expanded).toBe(true);
    await fireEvent.press(screen.getByRole('radio', { name: 'Sleep' }));
    expect(screen.queryByRole('radio', { name: 'Sleep' })).toBeNull();
    await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('page=0&size=3&locale=en&q=Sleep%20%26%20brain&category=sleep')));
    await fireEvent.changeText(screen.getByLabelText('Search titles'), '');
    await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('q=&category=sleep')));
  });

  it('resets pagination when searching from a later page', async () => {
    mockGet.mockImplementation(async path => {
      if (path.includes('/categories')) return [{ code: 'sleep', label: 'Sleep' }];
      return {
        items: [{ type: 'POST', content: { id: 'fixture-post', title: 'Fixture title', document: { type: 'doc', content: [] },
          publication_route: 'AUTHOR', category_code: 'sleep', published_at: '2026-11-01T12:00:00Z', created_at: '2026-11-01T12:00:00Z' } }],
        page: Number(new URL(path, 'https://example.test').searchParams.get('page')), size: 3, total: 9,
      };
    });
    await render(<DiscoverScreen />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('page=1')));
    await fireEvent.changeText(screen.getByLabelText('Search titles'), 'new title');
    await waitFor(() => expect(mockGet).toHaveBeenLastCalledWith(expect.stringContaining('page=0&size=3&locale=en&q=new%20title')));
  });

  it('waits 500 ms after the last keystroke and sends only the final query', async () => {
    jest.useFakeTimers();
    try {
      await render(<DiscoverScreen />);
      mockGet.mockClear();
      await fireEvent.changeText(screen.getByLabelText('Search titles'), 'sl');
      await act(async () => { jest.advanceTimersByTime(400); });
      expect(mockGet).not.toHaveBeenCalled();
      await fireEvent.changeText(screen.getByLabelText('Search titles'), 'sleep');
      await act(async () => { jest.advanceTimersByTime(499); });
      expect(mockGet).not.toHaveBeenCalled();
      await act(async () => { jest.advanceTimersByTime(1); });
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('q=sleep'));
    } finally {
      jest.useRealTimers();
    }
  });

  it('keeps search controls and filters off the Home feed', async () => {
    await render(<DiscoverScreen compact />);
    expect(screen.queryByLabelText('Search titles')).toBeNull();
    expect(mockGet).toHaveBeenCalledWith('/api/v1/science/posts?page=0');
  });
});
