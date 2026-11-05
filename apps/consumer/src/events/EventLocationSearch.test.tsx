import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useState } from 'react';
import { Text } from 'react-native';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { render } from '../test-utils';
import { EventLocationSearch, type EventLocation } from './EventLocationSearch';

const country = {
  id: 'austria',
  geoname_id: 1,
  name: 'Austria',
  label: 'Austria',
  label_en: 'Austria',
  label_pl: 'Austria',
};
const city = {
  id: 'vienna',
  geoname_id: 2,
  name: 'Wien',
  label: 'Vienna',
  label_en: 'Vienna',
  label_pl: 'Wiedeń',
  country_id: country.id,
  country_name: 'Austria',
  country_label_en: 'Austria',
  country_label_pl: 'Austria',
};
const mockLocations =
  jest.fn<(path: string, signal: AbortSignal) => Promise<unknown>>();
jest.mock('./discoveryApi', () => ({
  locationsGet: (path: string, signal: AbortSignal) =>
    mockLocations(path, signal),
}));
function LocationHarness() {
  const [value, setValue] = useState<EventLocation | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <>
      <EventLocationSearch
        value={value}
        onChange={setValue}
        onPendingChange={setPending}
      />
      <Text testID="selection">
        {value ? `${value.kind}:${value.record.id}` : 'none'}
      </Text>
      <Text testID="pending">{String(pending)}</Text>
    </>
  );
}
describe('structured location autocomplete', () => {
  beforeEach(() => {
    mockLocations.mockReset();
    mockLocations.mockImplementation(async (path) => ({
      items: path.startsWith('/countries') ? [country] : [city],
      page: 0,
      size: 10,
      total: 1,
    }));
  });
  it('selects a city with its country and clears the structured selection when typing again', async () => {
    await render(<LocationHarness />);
    await fireEvent.changeText(screen.getByLabelText('Location'), '  vie  ');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Vienna, Austria' }),
      ).toBeTruthy(),
    );
    expect(mockLocations.mock.calls.map(([path]) => path)).toEqual([
      '/countries?q=vie&locale=en&page=0&size=10',
      '/cities?q=vie&locale=en&page=0&size=10',
    ]);
    await fireEvent.press(
      screen.getByRole('button', { name: 'Vienna, Austria' }),
    );
    expect(screen.getByTestId('selection').props.children).toBe('city:vienna');
    expect(screen.getByTestId('pending').props.children).toBe('false');
    expect(screen.getByLabelText('Location').props.value).toBe(
      'Vienna, Austria',
    );
    expect(
      screen.queryByRole('button', { name: 'Vienna, Austria' }),
    ).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Location'), '');
    expect(screen.getByTestId('selection').props.children).toBe('none');
    expect(screen.getByTestId('pending').props.children).toBe('false');
  });
  it('allows country-only selection without guessing a city', async () => {
    await render(<LocationHarness />);
    await fireEvent.changeText(screen.getByLabelText('Location'), 'Austria');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Austria' })).toBeTruthy(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Austria' }));
    expect(screen.getByTestId('selection').props.children).toBe(
      'country:austria',
    );
  });
  it('debounces keystrokes and aborts pending searches when the component closes', async () => {
    jest.useFakeTimers();
    try {
      const rendered = await render(<LocationHarness />);
      await fireEvent.changeText(screen.getByLabelText('Location'), 'vi');
      await act(async () => jest.advanceTimersByTime(250));
      await fireEvent.changeText(screen.getByLabelText('Location'), 'vienna');
      await act(async () => jest.advanceTimersByTime(299));
      expect(mockLocations).not.toHaveBeenCalled();
      await act(async () => jest.advanceTimersByTime(1));
      expect(mockLocations).toHaveBeenCalledTimes(2);
      const signal = mockLocations.mock.calls[0]![1];
      await rendered.unmount();
      expect(signal.aborted).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});
