import { beforeEach, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import { CommentForm } from './DiscussionDetailScreen';
const mockRequest = jest.fn<(...args: unknown[]) => Promise<unknown>>();
const mockToken = jest.fn<() => Promise<string | null>>();
let mockUser = { uid: 'alice' };
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({
    status: 'authenticated',
    user: mockUser,
    getIdToken: mockToken,
  }),
}));
jest.mock('./discussionsApi', () => ({
  discussionRequest: (...args: unknown[]) => mockRequest(...args),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
beforeEach(() => {
  mockRequest.mockReset().mockResolvedValue(undefined);
  mockToken.mockReset().mockResolvedValue('token');
  mockUser = { uid: 'alice' };
});
it('submits a classified plain-text comment to the current account endpoint', async () => {
  const done = jest.fn();
  await render(<CommentForm discussionId="topic" onDone={done} />);
  await fireEvent.changeText(
    screen.getByLabelText('Add a comment'),
    'Personal perspective <b>plain text</b>',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));
  await waitFor(() => expect(done).toHaveBeenCalledTimes(1));
  expect(mockRequest).toHaveBeenCalledWith(
    '/me/discussions/topic/comments',
    'token',
    'POST',
    {
      content: 'Personal perspective <b>plain text</b>',
      kind: 'OPINION',
      parentId: null,
    },
  );
});
it('replies carry only the selected parent and reject empty content before sending', async () => {
  const done = jest.fn();
  await render(
    <CommentForm discussionId="topic" parentId="root" onDone={done} />,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));
  expect(mockRequest).not.toHaveBeenCalled();
  await fireEvent.changeText(
    screen.getByLabelText('Your reply'),
    'My experience',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));
  await waitFor(() => expect(done).toHaveBeenCalled());
  expect(mockRequest).toHaveBeenCalledWith(
    '/me/discussions/topic/comments',
    'token',
    'POST',
    { content: 'My experience', kind: 'OPINION', parentId: 'root' },
  );
});
it('uncertain write blocks another submission until refreshing comments', async () => {
  mockRequest.mockRejectedValueOnce(Error('timeout'));
  const done = jest.fn();
  await render(<CommentForm discussionId="topic" onDone={done} />);
  await fireEvent.changeText(
    screen.getByLabelText('Add a comment'),
    'A comment',
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Refresh comments and state' }),
    ).toBeTruthy(),
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));
  expect(mockRequest).toHaveBeenCalledTimes(1);
  expect(done).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole('button', { name: 'Refresh comments and state' }),
  );
  expect(done).toHaveBeenCalledTimes(1);
});
it('discards late completion after the account changes', async () => {
  let resolve!: () => void;
  mockRequest.mockImplementationOnce(
    () =>
      new Promise<void>((done) => {
        resolve = done;
      }),
  );
  const done = jest.fn();
  const view = await render(<CommentForm discussionId="topic" onDone={done} />);
  await fireEvent.changeText(screen.getByLabelText('Add a comment'), 'Alice');
  await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));
  await waitFor(() => expect(mockRequest).toHaveBeenCalledTimes(1));
  mockUser = { uid: 'bob' };
  await view.rerender(<CommentForm discussionId="topic" onDone={done} />);
  await act(async () => resolve());
  expect(done).not.toHaveBeenCalled();
});
