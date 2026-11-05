import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { radii, spacing, typography } from '@soberity/design-tokens';
import { useThemePreferences } from '../preferences/ThemePreferencesContext';
import { Alert, Button, LoadingState, Screen, TextField } from '../ui';
import { Pagination } from '../ui/Pagination';
import { EventSelect } from './EventSelect';
import { EventCard } from './EventCard';
import { LocationSelect } from './LocationSelect';
import type { LocationRecord } from './discoveryApi';
import { CATEGORY_CODES, eventsGet, type EventPage } from './eventsApi';
import { eventFilterQuery, initialEventFilters } from './eventFilters';

export default function EventsScreen() {
  const { t } = useTranslation();
  const { colors } = useThemePreferences();
  const [draft, setDraft] = useState(initialEventFilters);
  const [country, setCountry] = useState<LocationRecord | null>(null),
    [city, setCity] = useState<LocationRecord | null>(null);
  const [applied, setApplied] = useState(''),
    [page, setPage] = useState(0),
    [attempt, retry] = useState(0),
    [invalid, setInvalid] = useState(false);
  const [result, setResult] = useState<{
    key: string;
    data: EventPage | null;
    error: boolean;
  } | null>(null);
  const query = `${applied}${applied ? '&' : ''}page=${page}&size=12`;
  const data = result?.key === query ? result.data : null,
    error = result?.key === query && result.error;
  useFocusEffect(
    useCallback(() => {
      retry((value) => value + 1);
    }, []),
  );
  useEffect(() => {
    const controller = new AbortController();
    setResult(null);
    const timeout = setTimeout(() => {
      setResult({ key: query, data: null, error: true });
      controller.abort();
    }, 20000);
    void eventsGet<EventPage>(`?${query}`, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ key: query, data, error: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ key: query, data: null, error: true });
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, attempt]);
  const clear = () => {
    setDraft(initialEventFilters);
    setCountry(null);
    setCity(null);
    setApplied('');
    setPage(0);
    setInvalid(false);
    retry((value) => value + 1);
  };
  const apply = () => {
    try {
      const query = eventFilterQuery(draft);
      setApplied(query);
      setPage(0);
      setInvalid(false);
      retry((value) => value + 1);
    } catch {
      setInvalid(true);
    }
  };
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <Screen maxWidth={1040} avoidKeyboard>
      <View style={styles.intro}>
        <Text
          accessibilityRole="header"
          style={[styles.heading, { color: colors.primary }]}
        >
          {t('events.discoverTitle')}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {t('events.discoverDescription')}
        </Text>
      </View>
      <View
        style={[
          styles.filters,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TextField
          accentLabel
          label={t('events.searchName')}
          maxLength={200}
          value={draft.name}
          onChangeText={(name) =>
            setDraft((previous) => ({ ...previous, name }))
          }
          returnKeyType="search"
          onSubmitEditing={apply}
        />
        <View style={styles.row}>
          <View style={styles.field}>
            <LocationSelect
              kind="countries"
              value={country}
              onChange={(value) => {
                setCountry(value);
                setCity(null);
                setDraft((previous) => ({
                  ...previous,
                  countryId: value?.id ?? '',
                  cityId: '',
                }));
              }}
            />
          </View>
          <View style={styles.field}>
            <LocationSelect
              kind="cities"
              countryId={country?.id}
              value={city}
              onChange={(value) => {
                setCity(value);
                setDraft((previous) => ({
                  ...previous,
                  cityId: value?.id ?? '',
                }));
              }}
            />
          </View>
        </View>
        <EventSelect
          label={t('events.category')}
          value={draft.category}
          options={[
            { value: '', label: t('events.any') },
            ...CATEGORY_CODES.map((code) => ({
              value: code,
              label: t(`events.categories.${code}`),
            })),
          ]}
          onChange={(category) =>
            setDraft((previous) => ({ ...previous, category }))
          }
        />
        <View style={styles.row}>
          {(['from', 'to'] as const).map((key) => (
            <View key={key} style={styles.field}>
              <TextField
                accentLabel
                label={t(`events.${key}`)}
                value={draft[key]}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                autoCorrect={false}
                onChangeText={(value) =>
                  setDraft((previous) => ({ ...previous, [key]: value }))
                }
              />
            </View>
          ))}
        </View>
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          {t('events.dateHint', { zone })}
        </Text>
        {invalid ? (
          <Alert variant="danger" message={t('events.dateError')} />
        ) : null}
        <View style={styles.actions}>
          <Button label={t('events.apply')} onPress={apply} />
          <Button
            label={t('events.reset')}
            variant="tertiary"
            onPress={clear}
          />
        </View>
      </View>
      <View style={styles.intro}>
        <Text
          accessibilityRole="header"
          style={[styles.subheading, { color: colors.textPrimary }]}
        >
          {t('events.resultsTitle')}
        </Text>
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          {t('events.sortValues.START_ASC')}
        </Text>
        {applied ? (
          <Text style={[styles.caption, { color: colors.textMuted }]}>
            {t('events.appliedFilters')}
          </Text>
        ) : null}
      </View>
      {error ? (
        <View style={styles.intro}>
          <Alert variant="danger" message={t('events.error')} />
          <Button
            variant="secondary"
            label={t('events.retry')}
            onPress={() => retry((value) => value + 1)}
          />
        </View>
      ) : !data ? (
        <LoadingState label={t('events.loading')} />
      ) : !data.items.length ? (
        <View style={[styles.empty, { backgroundColor: colors.surfaceAlt }]}>
          <Text
            accessibilityRole="header"
            style={[styles.subheading, { color: colors.textPrimary }]}
          >
            {t('events.emptyTitle')}
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {t('events.emptyDescription')}
          </Text>
          <Button
            variant="tertiary"
            label={t(page > 0 ? 'events.firstPage' : 'events.reset')}
            onPress={page > 0 ? () => setPage(0) : clear}
          />
        </View>
      ) : (
        <>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.small, { color: colors.textSecondary }]}
          >
            {t('events.results', { count: data.total })}
          </Text>
          <View style={styles.grid}>
            {data.items.map((event) => (
              <View key={event.id} style={styles.cardSlot}>
                <EventCard
                  event={event}
                  category={t(`events.categories.${event.category_code}`)}
                />
              </View>
            ))}
          </View>
          <Pagination
            page={data.page}
            size={data.size}
            total={data.total}
            onPageChange={setPage}
            label={t('discover.page', {
              page: data.page + 1,
              pages: Math.max(1, Math.ceil(data.total / data.size)),
              count: data.total,
            })}
          />
        </>
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  intro: { gap: spacing.space8 },
  heading: { ...typography.h2 },
  subheading: { ...typography.h3 },
  body: { ...typography.body },
  small: { ...typography.small },
  caption: { ...typography.caption },
  filters: {
    padding: spacing.space16,
    borderWidth: 1,
    borderRadius: radii.lg,
    gap: spacing.space12,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space12 },
  field: { flexGrow: 1, flexBasis: 240, minWidth: 0 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space8 },
  empty: {
    padding: spacing.space24,
    borderRadius: radii.lg,
    gap: spacing.space12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.space16 },
  cardSlot: { flexGrow: 1, flexBasis: 300, minWidth: 0, maxWidth: '100%' },
});
