import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import EditorialPanel from './EditorialPanel';
import EditorialScreen from './EditorialScreen';
import { EditorialError, type Detail } from './editorialApi';

const mockToken = jest.fn(async () => 'token');
const mockRequest =
  jest.fn<
    (
      mockToken: string,
      path: string,
      method?: string,
      body?: unknown,
    ) => Promise<unknown>
  >();
jest.mock('../auth/AuthStatusContext', () => ({
  useAuthStatus: () => ({ getIdToken: mockToken }),
}));
jest.mock('./editorialApi', () => {
  const actual = jest.requireActual('./editorialApi') as object;
  return {
    ...actual,
    editorialRequest: (...args: Parameters<typeof mockRequest>) =>
      mockRequest(...args),
  };
});
let roles = ['REVIEWER'];
let own = false;
let fail = false;
const detail = (): Detail => ({
  id: 'revision',
  material_id: 'claim',
  version: 1,
  title: 'Synthetic claim',
  type: 'CLAIM',
  status: 'IN_REVIEW',
  locale: 'en',
  author_uid: own ? 'me' : 'other',
  summary: 'Summary',
  next_review_at: '2027-01-01T00:00:00Z',
  evidence: {
    claim_text: 'Synthetic claim',
    summary: 'Summary',
    evidence_level: 'LOW',
    evidence_rationale: 'Rationale',
    limitations: 'Fixture limitations',
    uncertainty: 'Fixture uncertainty',
    population: 'Fixture population',
    exposure: 'Fixture exposure',
    outcome: 'Fixture outcome',
    inference_type: 'ASSOCIATION',
    causal_justification: null,
    locale: 'en',
    next_review_at: '2027-01-01T00:00:00Z',
  },
  citations: [],
  review: [],
  versions: [],
  audit: [],
});
describe('editorial panel', () => {
  beforeEach(() => {
    roles = ['REVIEWER'];
    own = false;
    fail = false;
    mockRequest.mockReset();
    mockRequest.mockImplementation(async (_token, path, method) => {
      if (path === '/me') return { uid: 'me', roles };
      if (method === 'POST') {
        if (fail) throw new EditorialError(409);
        return undefined;
      }
      if (path.startsWith('/materials?'))
        return { items: [detail()], page: 0, size: 50, total: 1 };
      return detail();
    });
  });
  it('explains that the editorial workspace is web-only on native platforms', async () => {
    await render(<EditorialScreen />);
    expect(
      screen.getByText('Open the editorial workspace in a web browser.'),
    ).toBeTruthy();
    expect(mockRequest).not.toHaveBeenCalled();
  });
  it('does not load private materials for a user with no editorial role', async () => {
    roles = [];
    await render(<EditorialPanel />);
    await screen.findByText('This workspace requires editorial access.');
    expect(
      mockRequest.mock.calls.some((call) => call[1].startsWith('/materials')),
    ).toBe(false);
  });
  it('requires full review acknowledgement and a note before approval', async () => {
    await render(<EditorialPanel />);
    await fireEvent.press(
      await screen.findByTestId('editorial-material-revision'),
    );
    await screen.findByText('Fixture limitations');
    const approve = screen.getByRole('button', { name: 'Approve version' });
    expect(approve.props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(
      screen.getByLabelText('Assessment notes'),
      'Independent assessment',
    );
    await fireEvent.press(
      screen.getByText(
        'I checked the full text, sources, uncertainty, limitations and reuse rights.',
      ),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Approve version' }),
    );
    await waitFor(() =>
      expect(mockRequest).toHaveBeenCalledWith(
        'token',
        '/materials/CLAIM/revision/review',
        'POST',
        {
          decision: 'APPROVED',
          notes: 'Independent assessment',
          causalityApproved: false,
          causalAssessment: null,
        },
      ),
    );
  });
  it('hides self-approval even for a dual-role editor', async () => {
    own = true;
    roles = ['AUTHOR', 'REVIEWER'];
    await render(<EditorialPanel />);
    await fireEvent.press(
      await screen.findByTestId('editorial-material-revision'),
    );
    await screen.findByText('Fixture limitations');
    expect(
      screen.queryByRole('button', { name: 'Approve version' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Create a new version' }),
    ).toBeTruthy();
  });
  it('keeps a rejected operation visible without claiming success', async () => {
    fail = true;
    await render(<EditorialPanel />);
    await fireEvent.press(
      await screen.findByTestId('editorial-material-revision'),
    );
    await screen.findByText('Fixture limitations');
    await fireEvent.changeText(
      screen.getByLabelText('Assessment notes'),
      'Independent assessment',
    );
    await fireEvent.press(
      screen.getByText(
        'I checked the full text, sources, uncertainty, limitations and reuse rights.',
      ),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Approve version' }),
    );
    await screen.findByText(
      'The material changed or does not meet publication requirements. Refresh and check sources, review and dates.',
    );
    expect(screen.queryByText('Operation completed.')).toBeNull();
  });
});
